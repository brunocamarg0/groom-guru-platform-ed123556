import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  KPI,
  AgendamentoDono,
  ProfissionalDono,
  ClienteDono,
  PagamentoDono,
  PromocaoDono,
  AvaliacaoDono,
  ProdutoDono,
  NotificacaoDono,
  ConfiguracaoBarbearia,
  RelatorioDono,
} from "@/types/dono";

interface DonoContextType {
  loading: boolean;
  barbeariaId: string | null;
  kpi: KPI;
  agendamentos: AgendamentoDono[];
  profissionais: ProfissionalDono[];
  clientes: ClienteDono[];
  pagamentos: PagamentoDono[];
  promocoes: PromocaoDono[];
  avaliacoes: AvaliacaoDono[];
  produtos: ProdutoDono[];
  notificacoes: NotificacaoDono[];
  configuracao: ConfiguracaoBarbearia | null;
  servicos: any[];

  refresh: () => Promise<void>;

  criarAgendamento: (a: any) => Promise<void>;
  atualizarAgendamento: (id: string, dados: any) => Promise<void>;
  cancelarAgendamento: (id: string) => Promise<void>;
  confirmarAgendamento: (id: string) => Promise<void>;
  recusarAgendamento: (id: string, motivo?: string) => Promise<void>;

  adicionarProfissional: (p: any) => Promise<void>;
  atualizarProfissional: (id: string, dados: any) => Promise<void>;
  removerProfissional: (id: string) => Promise<void>;

  adicionarCliente: (c: any) => Promise<void>;
  atualizarCliente: (id: string, dados: any) => Promise<void>;
  removerCliente: (id: string) => Promise<void>;
  marcarClienteVIP: (id: string, vip: boolean) => Promise<void>;

  adicionarServico: (s: any) => Promise<void>;
  atualizarServico: (id: string, dados: any) => Promise<void>;
  removerServico: (id: string) => Promise<void>;
  toggleServicoAtivo: (id: string) => Promise<void>;

  registrarPagamento: (p: any) => Promise<void>;
  registrarPagamentoManual: (agendamentoId: string, valor: number, metodo: string, observacao?: string) => Promise<void>;

  criarPromocao: (p: any) => Promise<void>;
  atualizarPromocao: (id: string, dados: any) => Promise<void>;

  responderAvaliacao: (id: string, resposta: string) => Promise<void>;

  adicionarProduto: (p: any) => Promise<void>;
  atualizarProduto: (id: string, dados: any) => Promise<void>;
  atualizarEstoque: (id: string, quantidade: number) => Promise<void>;

  marcarNotificacaoLida: (id: string) => Promise<void>;

  atualizarConfiguracao: (dados: Partial<ConfiguracaoBarbearia>) => Promise<void>;

  gerarRelatorio: (dataInicio: string, dataFim: string) => RelatorioDono;
}

const DonoContext = createContext<DonoContextType | undefined>(undefined);

const kpiZero: KPI = {
  faturamentoHoje: 0,
  faturamentoSemana: 0,
  faturamentoMes: 0,
  agendamentosHoje: 0,
  cancelamentos: 0,
  clientesRecorrentes: 0,
  notaMedia: 0,
  totalAvaliacoes: 0,
  variacaoHoje: 0,
  variacaoSemana: 0,
  variacaoMes: 0,
};

const naoImplementado = (nome: string) => async () => {
  toast.info(`${nome}: em migração para o novo backend.`);
};

export function DonoProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [configuracao, setConfiguracao] = useState<ConfiguracaoBarbearia | null>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<ProfissionalDono[]>([]);
  const [clientes, setClientes] = useState<ClienteDono[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDono[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoDono[]>([]);
  const [promocoes, setPromocoes] = useState<PromocaoDono[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDono[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDono[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoDono[]>([]);

  // 1. Resolve barbeariaId via user_roles
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBarbeariaId(null);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("barbearia_id, role")
        .eq("user_id", user.id)
        .in("role", ["owner", "professional"])
        .not("barbearia_id", "is", null)
        .limit(1)
        .maybeSingle();
      setBarbeariaId(data?.barbearia_id ?? null);
    })();
  }, [user, authLoading]);

  // 2. Carrega dados quando barbeariaId estiver pronto
  const carregar = useCallback(async () => {
    if (!barbeariaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [barb, srv, profs, clis, ags, pags, promos, avals, prods, notifs, agProfs] = await Promise.all([
        supabase.from("barbearias").select("*").eq("id", barbeariaId).maybeSingle(),
        supabase.from("servicos").select("*").eq("barbearia_id", barbeariaId).order("ordem", { ascending: true }),
        supabase.from("profissionais").select("*").eq("barbearia_id", barbeariaId).order("nome"),
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("agendamentos").select("*").eq("barbearia_id", barbeariaId).order("data", { ascending: false }),
        supabase.from("pagamentos").select("*"),
        supabase.from("promocoes").select("*").eq("barbearia_id", barbeariaId),
        supabase.from("avaliacoes").select("*"),
        supabase.from("produtos").select("*").eq("barbearia_id", barbeariaId),
        supabase.from("notificacoes").select("*").eq("barbearia_id", barbeariaId).order("data", { ascending: false }),
        supabase.from("agendamento_profissional").select("*"),
      ]);

      // Configuração da barbearia
      const b = barb.data;
      if (b) {
        setConfiguracao({
          id: b.id,
          nome: b.nome,
          cnpjCpf: b.cnpj_cpf,
          foto: b.foto ?? undefined,
          endereco: b.endereco ?? undefined,
          cidade: b.cidade ?? undefined,
          bairro: b.bairro ?? undefined,
          cep: b.cep ?? undefined,
          telefone: b.telefone ?? undefined,
          email: b.email ?? undefined,
          modoConfirmacao: (b.modo_confirmacao as any) ?? "hibrido",
          horarioFuncionamento: {
            segunda: { aberto: true, inicio: "09:00", fim: "19:00" },
            terca: { aberto: true, inicio: "09:00", fim: "19:00" },
            quarta: { aberto: true, inicio: "09:00", fim: "19:00" },
            quinta: { aberto: true, inicio: "09:00", fim: "19:00" },
            sexta: { aberto: true, inicio: "09:00", fim: "19:00" },
            sabado: { aberto: true, inicio: "09:00", fim: "17:00" },
            domingo: { aberto: false, inicio: "09:00", fim: "13:00" },
          },
          politicaCancelamento: { prazoMinimo: 2, multa: 0, permitirReagendamento: true },
          linkAgendamento: `${window.location.origin}/cliente/agendar?b=${b.id}`,
          paginaPublica: true,
        });
      }

      setServicos(srv.data ?? []);

      // Profissionais
      setProfissionais(
        (profs.data ?? []).map((p: any): ProfissionalDono => ({
          id: p.id,
          nome: p.nome,
          email: p.email ?? undefined,
          telefone: p.telefone,
          foto: p.foto ?? undefined,
          especialidades: p.especialidades ?? [],
          comissao: { tipo: p.comissao_tipo, valor: Number(p.comissao_valor) },
          ativo: p.ativo,
          dataAdmissao: p.data_admissao,
          avaliacaoMedia: 0,
          totalAvaliacoes: 0,
          faturamentoTotal: 0,
          faltas: 0,
        }))
      );

      // Clientes
      setClientes(
        (clis.data ?? []).map((c: any): ClienteDono => ({
          id: c.id,
          nome: c.nome,
          email: c.email,
          telefone: c.telefone ?? "",
          foto: c.foto ?? undefined,
          dataNascimento: c.data_nascimento ?? undefined,
          vip: c.vip,
          totalAgendamentos: 0,
          ticketMedio: 0,
          frequencia: 0,
          dataCadastro: c.created_at,
        }))
      );

      // Mapas auxiliares
      const srvMap = new Map((srv.data ?? []).map((s: any) => [s.id, s]));
      const profMap = new Map((profs.data ?? []).map((p: any) => [p.id, p]));
      const agProfMap = new Map<string, string>(); // agendamentoId -> profissionalId
      (agProfs.data ?? []).forEach((ap: any) => agProfMap.set(ap.agendamento_id, ap.profissional_id));

      // Agendamentos
      const ags2 = (ags.data ?? []).map((a: any): AgendamentoDono => {
        const srvObj: any = srvMap.get(a.servico_id);
        const profId = agProfMap.get(a.id) ?? "";
        const profObj: any = profId ? profMap.get(profId) : null;
        return {
          id: a.id,
          clienteId: a.cliente_id ?? "",
          clienteNome: a.cliente_nome,
          clienteTelefone: a.telefone,
          profissionalId: profId,
          profissionalNome: profObj?.nome ?? "",
          servicoId: a.servico_id,
          servicoNome: srvObj?.nome ?? "",
          data: (a.data as string).slice(0, 10),
          horario: a.horario,
          duracao: srvObj?.duracao ?? 30,
          valor: srvObj ? Number(srvObj.preco) : 0,
          status: a.status as any,
          observacoes: a.observacao ?? undefined,
          dataCriacao: a.created_at,
        };
      });
      setAgendamentos(ags2);

      // Pagamentos
      setPagamentos(
        (pags.data ?? []).map((p: any): PagamentoDono => ({
          id: p.id,
          agendamentoId: p.agendamento_id,
          valor: Number(p.valor),
          metodo: p.metodo,
          status: p.status,
          taxaGateway: Number(p.taxa_gateway ?? 0),
          dataPagamento: p.data_pagamento ?? undefined,
          dataVencimento: p.data_vencimento ?? undefined,
        }))
      );

      // Promoções
      setPromocoes(
        (promos.data ?? []).map((p: any): PromocaoDono => ({
          id: p.id,
          nome: p.nome,
          tipo: p.tipo,
          valor: Number(p.valor),
          validoDe: p.valido_de,
          validoAte: p.valido_ate,
          ativo: p.ativo,
          aplicavelA: p.aplicavel_a,
          servicoId: p.servico_id ?? undefined,
          horarioInicio: p.horario_inicio ?? undefined,
          horarioFim: p.horario_fim ?? undefined,
        }))
      );

      // Avaliações
      setAvaliacoes(
        (avals.data ?? []).map((a: any): AvaliacaoDono => ({
          id: a.id,
          agendamentoId: a.agendamento_id,
          clienteId: a.cliente_id,
          clienteNome: "",
          profissionalId: "",
          profissionalNome: "",
          notaProfissional: a.nota_profissional,
          notaAtendimento: a.nota_atendimento,
          notaAmbiente: a.nota_ambiente,
          comentario: a.comentario ?? undefined,
          resposta: a.resposta ?? undefined,
          data: a.created_at,
        }))
      );

      // Produtos
      setProdutos(
        (prods.data ?? []).map((p: any): ProdutoDono => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao ?? undefined,
          categoria: p.categoria,
          preco: Number(p.preco),
          estoque: p.estoque,
          estoqueMinimo: p.estoque_minimo,
          ativo: p.ativo,
          foto: p.foto ?? undefined,
        }))
      );

      // Notificações
      setNotificacoes(
        (notifs.data ?? []).map((n: any): NotificacaoDono => ({
          id: n.id,
          tipo: n.tipo,
          titulo: n.titulo,
          mensagem: n.mensagem,
          lida: n.lida,
          data: n.data,
          acao: n.url_acao ? { url: n.url_acao, label: n.label_acao ?? "Abrir" } : undefined,
        }))
      );
    } catch (err: any) {
      console.error("[DonoContext] erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados da barbearia");
    } finally {
      setLoading(false);
    }
  }, [barbeariaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // KPI derivado
  const kpi = useMemo<KPI>(() => {
    if (!agendamentos.length) return kpiZero;
    const hojeStr = new Date().toISOString().slice(0, 10);
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    let faturamentoHoje = 0,
      faturamentoSemana = 0,
      faturamentoMes = 0,
      agendamentosHoje = 0,
      cancelamentos = 0;

    agendamentos.forEach((a) => {
      const d = new Date(a.data + "T12:00:00Z");
      const concluido = a.status === "concluido" || a.status === "confirmado";
      if (a.data === hojeStr) agendamentosHoje++;
      if (a.status === "cancelado" || a.status === "recusado") {
        if (d >= inicioMes) cancelamentos++;
      }
      if (concluido) {
        if (a.data === hojeStr) faturamentoHoje += a.valor;
        if (d >= inicioSemana) faturamentoSemana += a.valor;
        if (d >= inicioMes) faturamentoMes += a.valor;
      }
    });

    const notas = avaliacoes.map((a) => (a.notaProfissional + a.notaAtendimento + a.notaAmbiente) / 3);
    const notaMedia = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : 0;

    return {
      faturamentoHoje,
      faturamentoSemana,
      faturamentoMes,
      agendamentosHoje,
      cancelamentos,
      clientesRecorrentes: clientes.filter((c) => c.totalAgendamentos > 1).length,
      notaMedia,
      totalAvaliacoes: avaliacoes.length,
      variacaoHoje: 0,
      variacaoSemana: 0,
      variacaoMes: 0,
    };
  }, [agendamentos, avaliacoes, clientes]);

  // ===== Ações =====
  const guardBarbearia = () => {
    if (!barbeariaId) {
      toast.error("Nenhuma barbearia vinculada ao seu usuário");
      return false;
    }
    return true;
  };

  // Serviços
  const adicionarServico = async (s: any) => {
    if (!guardBarbearia()) return;
    const { error } = await supabase.from("servicos").insert({
      nome: s.nome,
      descricao: s.descricao,
      preco: s.preco,
      duracao: s.duracao,
      tipo: s.tipo,
      ordem: s.ordem ?? 0,
      ativo: s.ativo ?? true,
      barbearia_id: barbeariaId!,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Serviço adicionado");
    carregar();
  };
  const atualizarServico = async (id: string, dados: any) => {
    const { error } = await supabase.from("servicos").update(dados).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Serviço atualizado");
    carregar();
  };
  const removerServico = async (id: string) => {
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Serviço removido");
    carregar();
  };
  const toggleServicoAtivo = async (id: string) => {
    const atual = servicos.find((s) => s.id === id);
    if (!atual) return;
    await atualizarServico(id, { ativo: !atual.ativo });
  };

  // Profissionais
  const adicionarProfissional = async (p: any) => {
    if (!guardBarbearia()) return;
    const { error } = await supabase.from("profissionais").insert({
      nome: p.nome,
      email: p.email ?? null,
      telefone: p.telefone,
      foto: p.foto ?? null,
      especialidades: p.especialidades ?? [],
      comissao_tipo: p.comissao?.tipo ?? "percentual",
      comissao_valor: p.comissao?.valor ?? 0,
      comissao_assinatura: p.comissaoAssinatura ?? 0,
      ativo: p.ativo ?? true,
      barbearia_id: barbeariaId!,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Profissional adicionado");
    carregar();
  };
  const atualizarProfissional = async (id: string, dados: any) => {
    const payload: any = { ...dados };
    if (dados.comissao) {
      payload.comissao_tipo = dados.comissao.tipo;
      payload.comissao_valor = dados.comissao.valor;
      delete payload.comissao;
    }
    const { error } = await supabase.from("profissionais").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profissional atualizado");
    carregar();
  };
  const removerProfissional = async (id: string) => {
    const { error } = await supabase.from("profissionais").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profissional removido");
    carregar();
  };

  // Clientes
  const adicionarCliente = async (c: any) => {
    const { error } = await supabase.from("clientes").insert({
      nome: c.nome,
      email: c.email,
      telefone: c.telefone,
      foto: c.foto ?? null,
      data_nascimento: c.dataNascimento ?? null,
      vip: c.vip ?? false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente cadastrado");
    carregar();
  };
  const atualizarCliente = async (id: string, dados: any) => {
    const payload: any = {};
    if ("nome" in dados) payload.nome = dados.nome;
    if ("email" in dados) payload.email = dados.email;
    if ("telefone" in dados) payload.telefone = dados.telefone;
    if ("vip" in dados) payload.vip = dados.vip;
    if ("dataNascimento" in dados) payload.data_nascimento = dados.dataNascimento;
    if ("foto" in dados) payload.foto = dados.foto;
    const { error } = await supabase.from("clientes").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente atualizado");
    carregar();
  };
  const removerCliente = async (id: string) => {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente removido");
    carregar();
  };
  const marcarClienteVIP = async (id: string, vip: boolean) => {
    await atualizarCliente(id, { vip });
  };

  // Agendamentos
  const criarAgendamento = async (a: any) => {
    if (!guardBarbearia()) return;
    const dataIso = `${a.data}T12:00:00.000Z`;
    const { data: ag, error } = await supabase
      .from("agendamentos")
      .insert({
        cliente_id: a.clienteId ?? null,
        cliente_nome: a.clienteNome,
        telefone: a.clienteTelefone ?? "",
        servico_id: a.servicoId,
        data: dataIso,
        horario: a.horario,
        status: a.status ?? "pendente",
        observacao: a.observacoes ?? null,
        barbearia_id: barbeariaId!,
      })
      .select()
      .single();
    if (error || !ag) { toast.error(error?.message ?? "Erro ao criar agendamento"); return; }
    if (a.profissionalId) {
      await supabase.from("agendamento_profissional").insert({
        agendamento_id: ag.id,
        profissional_id: a.profissionalId,
      });
    }
    toast.success("Agendamento criado");
    carregar();
  };
  const atualizarAgendamento = async (id: string, dados: any) => {
    const { error } = await supabase.from("agendamentos").update(dados).eq("id", id);
    if (error) { toast.error(error.message); return; }
    carregar();
  };
  const cancelarAgendamento = async (id: string) => {
    await atualizarAgendamento(id, { status: "cancelado" });
    toast.success("Agendamento cancelado");
  };
  const confirmarAgendamento = async (id: string) => {
    await atualizarAgendamento(id, { status: "confirmado" });
    toast.success("Agendamento confirmado");
  };
  const recusarAgendamento = async (id: string, motivo?: string) => {
    await atualizarAgendamento(id, { status: "recusado", observacao: motivo });
    toast.success("Agendamento recusado");
  };

  // Notificações
  const marcarNotificacaoLida = async (id: string) => {
    const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  };

  // Configuração
  const atualizarConfiguracao = async (dados: Partial<ConfiguracaoBarbearia>) => {
    if (!barbeariaId) return;
    const payload: any = {};
    if (dados.nome) payload.nome = dados.nome;
    if (dados.telefone) payload.telefone = dados.telefone;
    if (dados.email) payload.email = dados.email;
    if (dados.endereco) payload.endereco = dados.endereco;
    if (dados.cidade) payload.cidade = dados.cidade;
    if (dados.bairro) payload.bairro = dados.bairro;
    if (dados.cep) payload.cep = dados.cep;
    if (dados.foto) payload.foto = dados.foto;
    if (dados.modoConfirmacao) payload.modo_confirmacao = dados.modoConfirmacao;
    const { error } = await supabase.from("barbearias").update(payload).eq("id", barbeariaId);
    if (error) { toast.error(error.message); return; }
    toast.success("Configuração salva");
    carregar();
  };

  // ===== Stubs (em migração) =====
  const registrarPagamento = naoImplementado("Registrar pagamento");
  const registrarPagamentoManual = naoImplementado("Pagamento manual");
  const criarPromocao = naoImplementado("Criar promoção");
  const atualizarPromocao = naoImplementado("Atualizar promoção");
  const responderAvaliacao = naoImplementado("Responder avaliação");
  const adicionarProduto = naoImplementado("Adicionar produto");
  const atualizarProduto = naoImplementado("Atualizar produto");
  const atualizarEstoque = naoImplementado("Atualizar estoque");

  const gerarRelatorio = (_dataInicio: string, _dataFim: string): RelatorioDono => ({
    periodo: "",
    faturamento: 0,
    agendamentos: 0,
    cancelamentos: 0,
    taxaCancelamento: 0,
    ticketMedio: 0,
    servicosMaisVendidos: [],
    profissionaisMaisRentaveis: [],
    horariosPico: [],
  });

  return (
    <DonoContext.Provider
      value={{
        loading: loading || authLoading,
        barbeariaId,
        kpi,
        agendamentos,
        profissionais,
        clientes,
        pagamentos,
        promocoes,
        avaliacoes,
        produtos,
        notificacoes,
        configuracao,
        servicos,
        refresh: carregar,
        criarAgendamento,
        atualizarAgendamento,
        cancelarAgendamento,
        confirmarAgendamento,
        recusarAgendamento,
        adicionarProfissional,
        atualizarProfissional,
        removerProfissional,
        adicionarCliente,
        atualizarCliente,
        removerCliente,
        marcarClienteVIP,
        adicionarServico,
        atualizarServico,
        removerServico,
        toggleServicoAtivo,
        registrarPagamento: registrarPagamento as any,
        registrarPagamentoManual: registrarPagamentoManual as any,
        criarPromocao: criarPromocao as any,
        atualizarPromocao: atualizarPromocao as any,
        responderAvaliacao: responderAvaliacao as any,
        adicionarProduto: adicionarProduto as any,
        atualizarProduto: atualizarProduto as any,
        atualizarEstoque: atualizarEstoque as any,
        marcarNotificacaoLida,
        atualizarConfiguracao,
        gerarRelatorio,
      }}
    >
      {children}
    </DonoContext.Provider>
  );
}

export function useDono() {
  const ctx = useContext(DonoContext);
  if (!ctx) throw new Error("useDono deve ser usado dentro de DonoProvider");
  return ctx;
}
