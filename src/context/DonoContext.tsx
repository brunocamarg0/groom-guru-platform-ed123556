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
  planosCliente: any[];
  assinaturasCliente: any[];
  comissoes: any[];
  minhaAssinatura: any | null;
  faturas: any[];

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
  removerPromocao: (id: string) => Promise<void>;

  responderAvaliacao: (id: string, resposta: string) => Promise<void>;

  adicionarProduto: (p: any) => Promise<void>;
  atualizarProduto: (id: string, dados: any) => Promise<void>;
  removerProduto: (id: string) => Promise<void>;
  atualizarEstoque: (id: string, quantidade: number) => Promise<void>;

  marcarNotificacaoLida: (id: string) => Promise<void>;

  atualizarConfiguracao: (dados: Partial<ConfiguracaoBarbearia>) => Promise<void>;

  criarPlanoCliente: (p: any) => Promise<void>;
  atualizarPlanoCliente: (id: string, dados: any) => Promise<void>;
  removerPlanoCliente: (id: string) => Promise<void>;

  marcarComissaoPaga: (id: string, observacao?: string) => Promise<void>;

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
  const [planosCliente, setPlanosCliente] = useState<any[]>([]);
  const [assinaturasCliente, setAssinaturasCliente] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [minhaAssinatura, setMinhaAssinatura] = useState<any | null>(null);
  const [faturas, setFaturas] = useState<any[]>([]);

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
      // Carrega agendamentos primeiro para usar IDs nos filtros derivados
      const ags = await supabase
        .from("agendamentos")
        .select("*")
        .eq("barbearia_id", barbeariaId)
        .order("data", { ascending: false });
      const agendamentoIds = (ags.data ?? []).map((a: any) => a.id);

      const [barb, srv, profs, clis, pags, promos, avals, prods, notifs, agProfs, plCli, asCli, comms, asMine, fats] = await Promise.all([
        supabase.from("barbearias").select("*").eq("id", barbeariaId).maybeSingle(),
        supabase.from("servicos").select("*").eq("barbearia_id", barbeariaId).order("ordem", { ascending: true }),
        supabase.from("profissionais").select("*").eq("barbearia_id", barbeariaId).order("nome"),
        supabase.from("clientes").select("*").order("nome"),
        agendamentoIds.length
          ? supabase.from("pagamentos").select("*").in("agendamento_id", agendamentoIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("promocoes").select("*").eq("barbearia_id", barbeariaId),
        agendamentoIds.length
          ? supabase.from("avaliacoes").select("*").in("agendamento_id", agendamentoIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("produtos").select("*").eq("barbearia_id", barbeariaId),
        supabase.from("notificacoes").select("*").eq("barbearia_id", barbeariaId).order("data", { ascending: false }),
        agendamentoIds.length
          ? supabase.from("agendamento_profissional").select("*").in("agendamento_id", agendamentoIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("planos_cliente").select("*").eq("barbearia_id", barbeariaId).order("created_at", { ascending: false }),
        supabase.from("assinaturas_cliente").select("*, plano:planos_cliente!inner(*), cliente:clientes(*)").eq("plano.barbearia_id", barbeariaId).order("created_at", { ascending: false }),
        supabase.from("comissoes_pagas").select("*").eq("barbearia_id", barbeariaId).order("created_at", { ascending: false }),
        supabase.from("assinaturas").select("*, plano:planos(*)").eq("barbearia_id", barbeariaId).maybeSingle(),
        supabase.from("faturas").select("*").order("created_at", { ascending: false }),
      ]);

      setPlanosCliente(plCli.data ?? []);
      setAssinaturasCliente(asCli.data ?? []);
      setComissoes(comms.data ?? []);
      setMinhaAssinatura(asMine.data ?? null);
      setFaturas((fats.data ?? []).filter((f: any) => !asMine.data || f.assinatura_id === asMine.data.id));

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
    if ("comissaoAssinatura" in payload) {
      payload.comissao_assinatura = payload.comissaoAssinatura;
      delete payload.comissaoAssinatura;
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
    const emailNorm = (c.email ?? "").trim().toLowerCase();
    const telefoneNorm = (c.telefone ?? "").trim();

    if (emailNorm) {
      const { data: jaExisteEmail } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", emailNorm)
        .maybeSingle();
      if (jaExisteEmail) {
        toast.error("Já existe um cliente cadastrado com este email");
        return;
      }
    }

    const { error } = await supabase.from("clientes").insert({
      nome: c.nome,
      email: emailNorm || `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@temp.local`,
      telefone: telefoneNorm || null,
      foto: c.foto ?? null,
      data_nascimento: c.dataNascimento ?? null,
      vip: c.vip ?? false,
    });
    if (error) {
      if ((error as any).code === "23505") {
        toast.error("Já existe um cliente com este email");
      } else {
        toast.error(error.message);
      }
      return;
    }
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
    if ("nome" in dados) payload.nome = dados.nome;
    if ("cnpjCpf" in dados) payload.cnpj_cpf = dados.cnpjCpf;
    if ("telefone" in dados) payload.telefone = dados.telefone;
    if ("email" in dados) payload.email = dados.email;
    if ("endereco" in dados) payload.endereco = dados.endereco;
    if ("cidade" in dados) payload.cidade = dados.cidade;
    if ("bairro" in dados) payload.bairro = dados.bairro;
    if ("cep" in dados) payload.cep = dados.cep;
    if ("foto" in dados) payload.foto = dados.foto ?? null;
    if ("modoConfirmacao" in dados) payload.modo_confirmacao = dados.modoConfirmacao;
    const { error } = await supabase.from("barbearias").update(payload).eq("id", barbeariaId);
    if (error) { toast.error(error.message); throw error; }
    toast.success("Configuração salva");
    await carregar();
  };

  // ===== Promoções =====
  const criarPromocao = async (p: any) => {
    if (!guardBarbearia()) return;
    const { error } = await supabase.from("promocoes").insert({
      nome: p.nome,
      tipo: p.tipo,
      valor: p.valor,
      valido_de: p.validoDe,
      valido_ate: p.validoAte,
      ativo: p.ativo ?? true,
      aplicavel_a: p.aplicavelA ?? "todos",
      servico_id: p.servicoId ?? null,
      horario_inicio: p.horarioInicio ?? null,
      horario_fim: p.horarioFim ?? null,
      barbearia_id: barbeariaId!,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Promoção criada");
    carregar();
  };
  const atualizarPromocao = async (id: string, dados: any) => {
    const payload: any = {};
    if ("nome" in dados) payload.nome = dados.nome;
    if ("tipo" in dados) payload.tipo = dados.tipo;
    if ("valor" in dados) payload.valor = dados.valor;
    if ("validoDe" in dados) payload.valido_de = dados.validoDe;
    if ("validoAte" in dados) payload.valido_ate = dados.validoAte;
    if ("ativo" in dados) payload.ativo = dados.ativo;
    if ("aplicavelA" in dados) payload.aplicavel_a = dados.aplicavelA;
    if ("servicoId" in dados) payload.servico_id = dados.servicoId;
    if ("horarioInicio" in dados) payload.horario_inicio = dados.horarioInicio;
    if ("horarioFim" in dados) payload.horario_fim = dados.horarioFim;
    const { error } = await supabase.from("promocoes").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Promoção atualizada");
    carregar();
  };
  const removerPromocao = async (id: string) => {
    const { error } = await supabase.from("promocoes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Promoção removida");
    carregar();
  };

  // ===== Avaliações =====
  const responderAvaliacao = async (id: string, resposta: string) => {
    const { error } = await supabase
      .from("avaliacoes")
      .update({ resposta, respondido_em: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Resposta enviada");
    carregar();
  };

  // ===== Produtos =====
  const adicionarProduto = async (p: any) => {
    if (!guardBarbearia()) return;
    const { error } = await supabase.from("produtos").insert({
      nome: p.nome,
      descricao: p.descricao ?? null,
      categoria: p.categoria,
      preco: p.preco,
      estoque: p.estoque ?? 0,
      estoque_minimo: p.estoqueMinimo ?? 0,
      ativo: p.ativo ?? true,
      foto: p.foto ?? null,
      barbearia_id: barbeariaId!,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Produto adicionado");
    carregar();
  };
  const atualizarProduto = async (id: string, dados: any) => {
    const payload: any = {};
    if ("nome" in dados) payload.nome = dados.nome;
    if ("descricao" in dados) payload.descricao = dados.descricao;
    if ("categoria" in dados) payload.categoria = dados.categoria;
    if ("preco" in dados) payload.preco = dados.preco;
    if ("estoque" in dados) payload.estoque = dados.estoque;
    if ("estoqueMinimo" in dados) payload.estoque_minimo = dados.estoqueMinimo;
    if ("ativo" in dados) payload.ativo = dados.ativo;
    if ("foto" in dados) payload.foto = dados.foto;
    const { error } = await supabase.from("produtos").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto atualizado");
    carregar();
  };
  const removerProduto = async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto removido");
    carregar();
  };
  const atualizarEstoque = async (id: string, quantidade: number) => {
    const { error } = await supabase.from("produtos").update({ estoque: quantidade }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estoque atualizado");
    carregar();
  };

  // ===== Pagamentos =====
  const registrarPagamento = async (p: any) => {
    const { error } = await supabase.from("pagamentos").insert({
      agendamento_id: p.agendamentoId,
      valor: p.valor,
      metodo: p.metodo,
      status: p.status ?? "pago",
      taxa_gateway: p.taxaGateway ?? 0,
      data_pagamento: p.dataPagamento ?? new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pagamento registrado");
    carregar();
  };
  const registrarPagamentoManual = async (
    agendamentoId: string,
    valor: number,
    metodo: string,
    observacao?: string
  ) => {
    const { error } = await supabase.from("pagamentos").insert({
      agendamento_id: agendamentoId,
      valor,
      metodo,
      status: "pago",
      data_pagamento: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    if (observacao) {
      await supabase.from("agendamentos").update({ observacao }).eq("id", agendamentoId);
    }
    toast.success("Pagamento registrado");
    carregar();
  };

  // ===== Planos cliente =====
  const criarPlanoCliente = async (p: any) => {
    if (!guardBarbearia()) return;
    const { error } = await supabase.from("planos_cliente").insert({
      nome: p.nome,
      descricao: p.descricao ?? null,
      valor: p.valor,
      duracao_meses: p.duracaoMeses ?? p.duracao_meses ?? 1,
      beneficios: p.beneficios ?? [],
      ativo: p.ativo ?? true,
      barbearia_id: barbeariaId!,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Plano criado");
    carregar();
  };
  const atualizarPlanoCliente = async (id: string, dados: any) => {
    const payload: any = {};
    if ("nome" in dados) payload.nome = dados.nome;
    if ("descricao" in dados) payload.descricao = dados.descricao;
    if ("valor" in dados) payload.valor = dados.valor;
    if ("duracaoMeses" in dados) payload.duracao_meses = dados.duracaoMeses;
    if ("duracao_meses" in dados) payload.duracao_meses = dados.duracao_meses;
    if ("beneficios" in dados) payload.beneficios = dados.beneficios;
    if ("ativo" in dados) payload.ativo = dados.ativo;
    const { error } = await supabase.from("planos_cliente").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plano atualizado");
    carregar();
  };
  const removerPlanoCliente = async (id: string) => {
    const { error } = await supabase.from("planos_cliente").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plano removido");
    carregar();
  };

  // ===== Comissões =====
  const marcarComissaoPaga = async (id: string, observacao?: string) => {
    const { error } = await supabase
      .from("comissoes_pagas")
      .update({ pago: true, data_pagamento: new Date().toISOString(), observacao: observacao ?? null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Comissão marcada como paga");
    carregar();
  };

  // ===== Relatório =====
  const gerarRelatorio = (dataInicio: string, dataFim: string): RelatorioDono => {
    const inicio = dataInicio;
    const fim = dataFim;
    const agsP = agendamentos.filter((a) => a.data >= inicio && a.data <= fim);
    const concluidos = agsP.filter((a) => a.status === "concluido" || a.status === "confirmado");
    const cancelados = agsP.filter((a) => a.status === "cancelado" || a.status === "recusado");
    const faturamento = concluidos.reduce((s, a) => s + a.valor, 0);
    const taxaCancelamento = agsP.length ? (cancelados.length / agsP.length) * 100 : 0;
    const ticketMedio = concluidos.length ? faturamento / concluidos.length : 0;

    const servicoMap = new Map<string, { servico: string; quantidade: number; receita: number }>();
    concluidos.forEach((a) => {
      const key = a.servicoNome || a.servicoId;
      const prev = servicoMap.get(key) ?? { servico: key, quantidade: 0, receita: 0 };
      prev.quantidade++;
      prev.receita += a.valor;
      servicoMap.set(key, prev);
    });

    const profMap = new Map<string, { profissional: string; receita: number }>();
    concluidos.forEach((a) => {
      const key = a.profissionalNome || a.profissionalId || "—";
      const prev = profMap.get(key) ?? { profissional: key, receita: 0 };
      prev.receita += a.valor;
      profMap.set(key, prev);
    });

    const horMap = new Map<string, { horario: string; quantidade: number }>();
    concluidos.forEach((a) => {
      const prev = horMap.get(a.horario) ?? { horario: a.horario, quantidade: 0 };
      prev.quantidade++;
      horMap.set(a.horario, prev);
    });

    return {
      periodo: `${inicio} a ${fim}`,
      faturamento,
      agendamentos: agsP.length,
      cancelamentos: cancelados.length,
      taxaCancelamento,
      ticketMedio,
      servicosMaisVendidos: Array.from(servicoMap.values()).sort((a, b) => b.receita - a.receita).slice(0, 10),
      profissionaisMaisRentaveis: Array.from(profMap.values()).sort((a, b) => b.receita - a.receita),
      horariosPico: Array.from(horMap.values()).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
    };
  };

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
        planosCliente,
        assinaturasCliente,
        comissoes,
        minhaAssinatura,
        faturas,
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
        registrarPagamento,
        registrarPagamentoManual,
        criarPromocao,
        atualizarPromocao,
        removerPromocao,
        responderAvaliacao,
        adicionarProduto,
        atualizarProduto,
        removerProduto,
        atualizarEstoque,
        marcarNotificacaoLida,
        atualizarConfiguracao,
        criarPlanoCliente,
        atualizarPlanoCliente,
        removerPlanoCliente,
        marcarComissaoPaga,
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
