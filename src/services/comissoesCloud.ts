import { supabase } from "@/integrations/supabase/client";

// Helpers
function periodo(mes: number, ano: number) {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));
  const fim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
  const mesReferencia = `${ano}-${String(mes).padStart(2, "0")}`;
  return { inicio, fim, mesReferencia };
}

function calcularValor(prof: any, valorTotal: number) {
  const tipo = prof.comissao_tipo;
  const valor = Number(prof.comissao_valor) || 0;
  if (tipo === "percentual") {
    return { valorComissao: (valorTotal * valor) / 100, porcentagem: valor };
  }
  return { valorComissao: valor, porcentagem: 0 };
}

async function buscarAgendamentosProfissional(
  barbeariaId: string,
  profissionalId: string,
  inicio: Date,
  fim: Date
) {
  const { data: links } = await supabase
    .from("agendamento_profissional")
    .select("agendamento_id")
    .eq("profissional_id", profissionalId);
  const ids = (links || []).map((l: any) => l.agendamento_id);
  if (!ids.length) return [];

  const { data: agends } = await supabase
    .from("agendamentos")
    .select(
      "id, data, horario, cliente_nome, status, servico:servicos(id, nome, preco)"
    )
    .eq("barbearia_id", barbeariaId)
    .in("id", ids)
    .gte("data", inicio.toISOString())
    .lte("data", fim.toISOString())
    .in("status", ["confirmado", "concluido"]);
  return agends || [];
}

export async function getResumoComissoes(
  barbeariaId: string,
  mes: number,
  ano: number
) {
  const { inicio, fim, mesReferencia } = periodo(mes, ano);

  const { data: profissionais } = await supabase
    .from("profissionais")
    .select("id, nome, comissao_tipo, comissao_valor, ativo")
    .eq("barbearia_id", barbeariaId)
    .eq("ativo", true);

  const resumos = await Promise.all(
    (profissionais || []).map(async (prof: any) => {
      const agends = await buscarAgendamentosProfissional(
        barbeariaId,
        prof.id,
        inicio,
        fim
      );

      let totalValor = 0;
      let totalComissao = 0;
      agends.forEach((a: any) => {
        if (!a.servico) return;
        const preco = Number(a.servico.preco) || 0;
        totalValor += preco;
        totalComissao += calcularValor(prof, preco).valorComissao;
      });

      const { data: pagas } = await supabase
        .from("comissoes_pagas")
        .select("valor_comissao")
        .eq("profissional_id", prof.id)
        .eq("mes_referencia", mesReferencia)
        .eq("pago", true);
      const totalPago = (pagas || []).reduce(
        (s: number, c: any) => s + Number(c.valor_comissao || 0),
        0
      );

      return {
        profissional: {
          id: prof.id,
          nome: prof.nome,
          comissaoTipo: prof.comissao_tipo,
          comissaoValor: Number(prof.comissao_valor) || 0,
        },
        resumo: {
          totalAgendamentos: agends.length,
          totalValor,
          totalComissao,
          totalPago,
          totalPendente: totalComissao - totalPago,
        },
      };
    })
  );

  return {
    mesReferencia,
    resumoGeral: {
      totalComissao: resumos.reduce((s, r) => s + r.resumo.totalComissao, 0),
      totalPago: resumos.reduce((s, r) => s + r.resumo.totalPago, 0),
      totalPendente: resumos.reduce((s, r) => s + r.resumo.totalPendente, 0),
    },
    profissionais: resumos,
  };
}

export async function getComissoesProfissional(
  barbeariaId: string,
  profissionalId: string,
  mes: number,
  ano: number
) {
  const { inicio, fim, mesReferencia } = periodo(mes, ano);

  const { data: prof } = await supabase
    .from("profissionais")
    .select("id, nome, comissao_tipo, comissao_valor")
    .eq("id", profissionalId)
    .maybeSingle();
  if (!prof) return { comissoes: [], profissional: null };

  const agends = await buscarAgendamentosProfissional(
    barbeariaId,
    profissionalId,
    inicio,
    fim
  );

  const { data: pagas } = await supabase
    .from("comissoes_pagas")
    .select("agendamento_id")
    .eq("profissional_id", profissionalId)
    .eq("mes_referencia", mesReferencia)
    .eq("pago", true);
  const idsPagos = new Set((pagas || []).map((c: any) => c.agendamento_id));

  const comissoes = agends
    .filter((a: any) => a.servico)
    .map((a: any) => {
      const preco = Number(a.servico.preco) || 0;
      const calc = calcularValor(prof, preco);
      return {
        agendamentoId: a.id,
        data: a.data,
        horario: a.horario,
        cliente: a.cliente_nome,
        servico: a.servico.nome,
        valorTotal: preco,
        valorComissao: calc.valorComissao,
        porcentagem: calc.porcentagem,
        pago: idsPagos.has(a.id),
      };
    });

  return { comissoes, profissional: prof };
}

export async function marcarComissaoPaga(
  barbeariaId: string,
  agendamentoId: string,
  profissionalId: string
) {
  const { data: agend } = await supabase
    .from("agendamentos")
    .select("id, data, servico:servicos(preco)")
    .eq("id", agendamentoId)
    .maybeSingle();
  if (!agend || !agend.servico) throw new Error("Agendamento inválido");

  const { data: prof } = await supabase
    .from("profissionais")
    .select("comissao_tipo, comissao_valor")
    .eq("id", profissionalId)
    .maybeSingle();
  if (!prof) throw new Error("Profissional inválido");

  const preco = Number((agend.servico as any).preco) || 0;
  const calc = calcularValor(prof, preco);
  const d = new Date(agend.data);
  const mesReferencia = `${d.getUTCFullYear()}-${String(
    d.getUTCMonth() + 1
  ).padStart(2, "0")}`;

  // Manual upsert
  const { data: existente } = await supabase
    .from("comissoes_pagas")
    .select("id")
    .eq("agendamento_id", agendamentoId)
    .eq("profissional_id", profissionalId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("comissoes_pagas")
      .update({ pago: true, data_pagamento: new Date().toISOString() })
      .eq("id", existente.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("comissoes_pagas").insert({
      barbearia_id: barbeariaId,
      profissional_id: profissionalId,
      agendamento_id: agendamentoId,
      valor_comissao: calc.valorComissao,
      valor_total: preco,
      porcentagem: calc.porcentagem,
      mes_referencia: mesReferencia,
      pago: true,
      data_pagamento: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

export async function marcarTodasComissoesPagas(
  barbeariaId: string,
  profissionalId: string,
  mes: number,
  ano: number
) {
  const { comissoes } = await getComissoesProfissional(
    barbeariaId,
    profissionalId,
    mes,
    ano
  );
  const pendentes = comissoes.filter((c) => !c.pago);
  for (const c of pendentes) {
    await marcarComissaoPaga(barbeariaId, c.agendamentoId, profissionalId);
  }
  return { total: pendentes.length };
}

// ============ Assinaturas ============
export async function getResumoComissoesAssinatura(
  barbeariaId: string,
  mes: number,
  ano: number
) {
  const { mesReferencia } = periodo(mes, ano);
  const { data } = await supabase
    .from("comissoes_assinatura")
    .select("valor_comissao, pago")
    .eq("barbearia_id", barbeariaId)
    .eq("mes_referencia", mesReferencia);
  const list = data || [];
  const totalComissao = list.reduce(
    (s: number, c: any) => s + Number(c.valor_comissao || 0),
    0
  );
  const totalPago = list
    .filter((c: any) => c.pago)
    .reduce((s: number, c: any) => s + Number(c.valor_comissao || 0), 0);
  return {
    totalGeral: {
      totalComissao,
      totalPago,
      totalPendente: totalComissao - totalPago,
    },
  };
}

export async function getComissoesAssinatura(
  barbeariaId: string,
  profissionalId: string,
  mes: number,
  ano: number
) {
  const { mesReferencia } = periodo(mes, ano);
  const { data } = await supabase
    .from("comissoes_assinatura")
    .select(
      "id, valor_total, valor_comissao, pago, data_pagamento, assinatura:assinaturas_cliente(id, plano:planos_cliente(nome), cliente:clientes(nome))"
    )
    .eq("barbearia_id", barbeariaId)
    .eq("profissional_id", profissionalId)
    .eq("mes_referencia", mesReferencia);
  return { comissoes: data || [] };
}

export async function marcarComissaoAssinaturaPaga(comissaoId: string) {
  const { error } = await supabase
    .from("comissoes_assinatura")
    .update({ pago: true, data_pagamento: new Date().toISOString() })
    .eq("id", comissaoId);
  if (error) throw error;
}

// ============ Relatório completo (simplificado) ============
export async function getRelatorioCompleto(
  barbeariaId: string,
  profissionalId: string,
  mes: number,
  ano: number
) {
  const { inicio, fim, mesReferencia } = periodo(mes, ano);

  const { data: comServicos } = await supabase
    .from("comissoes_pagas")
    .select(
      "id, valor_total, valor_comissao, pago, agendamento:agendamentos(id, cliente_nome, servico:servicos(nome))"
    )
    .eq("barbearia_id", barbeariaId)
    .eq("profissional_id", profissionalId)
    .gte("created_at", inicio.toISOString())
    .lte("created_at", fim.toISOString());

  const { data: comAssinaturas } = await supabase
    .from("comissoes_assinatura")
    .select(
      "id, valor_total, valor_comissao, pago, assinatura:assinaturas_cliente(plano:planos_cliente(nome), cliente:clientes(nome))"
    )
    .eq("barbearia_id", barbeariaId)
    .eq("profissional_id", profissionalId)
    .eq("mes_referencia", mesReferencia);

  const comissoesServicos = (comServicos || []).map((c: any) => ({
    id: c.id,
    cliente: { nome: c.agendamento?.cliente_nome || "—" },
    servico: { nome: c.agendamento?.servico?.nome || "—" },
    valorTotal: Number(c.valor_total) || 0,
    valorComissao: Number(c.valor_comissao) || 0,
    pago: c.pago,
  }));

  const comissoesAssinatura = (comAssinaturas || []).map((c: any) => ({
    id: c.id,
    cliente: { nome: c.assinatura?.cliente?.nome || "—" },
    plano: { nome: c.assinatura?.plano?.nome || "—" },
    valorTotal: Number(c.valor_total) || 0,
    valorComissao: Number(c.valor_comissao) || 0,
    pago: c.pago,
  }));

  const sumar = (arr: any[]) => ({
    total: arr.reduce((s, c) => s + c.valorComissao, 0),
    pago: arr.filter((c) => c.pago).reduce((s, c) => s + c.valorComissao, 0),
    pendente: arr
      .filter((c) => !c.pago)
      .reduce((s, c) => s + c.valorComissao, 0),
    quantidade: arr.length,
  });

  const resumoServicos = sumar(comissoesServicos);
  const resumoAssin = sumar(comissoesAssinatura);

  return {
    resumo: {
      geral: {
        total: resumoServicos.total + resumoAssin.total,
        pago: resumoServicos.pago + resumoAssin.pago,
        pendente: resumoServicos.pendente + resumoAssin.pendente,
      },
      servicos: resumoServicos,
      assinaturas: resumoAssin,
    },
    clientesAtribuidos: [],
    comissoesServicos,
    comissoesAssinatura,
  };
}
