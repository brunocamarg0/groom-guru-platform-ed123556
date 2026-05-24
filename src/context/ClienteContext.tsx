import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Agendamento,
  Cliente,
  Servico,
  NovoAgendamento,
  StatusAgendamento,
  Pagamento,
  MetodoPagamento,
  StatusPagamento,
} from "@/types/cliente";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ClienteContextType {
  cliente: Cliente | null;
  agendamentos: Agendamento[];
  servicos: Servico[];
  pagamentos: Pagamento[];
  loading: boolean;
  setCliente: (cliente: Cliente | null) => void;
  criarAgendamento: (agendamento: NovoAgendamento) => Promise<Agendamento>;
  cancelarAgendamento: (id: string) => Promise<void>;
  criarPagamento: (
    agendamentoId: string,
    valor: number,
    metodo: MetodoPagamento
  ) => Promise<Pagamento>;
  atualizarStatusPagamento: (id: string, status: StatusPagamento) => Promise<void>;
  getAgendamento: (id: string) => Agendamento | undefined;
  getAgendamentosPorStatus: (status: StatusAgendamento) => Agendamento[];
  getServicosPorBarbearia: (barbeariaId: string) => Servico[];
  carregarDados: () => Promise<void>;
  atualizarPerfil: (dados: Partial<Cliente>) => Promise<void>;
  getProximoAgendamento: () => Agendamento | null;
  fidelidade: {
    pontos: number;
    nivel: string;
    cortesRealizados: number;
    proximoDesconto: { cortesNecessarios: number; desconto: number };
    progressoProximoNivel: number;
  };
  notificacoes: Array<{
    id: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
    data: string;
    tipo?: string;
    canal?: string;
  }>;
  barbearias: any[];
  buscarBarbearias: (busca?: string, cidade?: string, bairro?: string) => Promise<void>;
  buscarBarbeariaPorId: (id: string) => Promise<any>;
  criarAvaliacao?: (dados: any) => Promise<void>;
  realizarPagamento?: (agendamentoId: string, dados: any) => Promise<Pagamento>;
  marcarNotificacaoLida?: (id: string) => Promise<void>;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

// Mapeia data ISO do banco (timestamptz noon UTC) -> YYYY-MM-DD
function isoToDateOnly(iso: string | null | undefined): string {
  if (!iso) return new Date().toISOString().split("T")[0];
  const d = new Date(iso);
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dateOnlyToNoonUtcIso(date: string): string {
  return `${date}T12:00:00.000Z`;
}

export function ClienteProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user, roles, loading: authLoading } = useAuth();

  const isClienteLogado = !!user && (roles.includes("client") || roles.includes("super_admin"));

  const [barbearias, setBarbearias] = useState<any[]>([]);
  const [notificacoes] = useState<any[]>([]);

  // PERFIL do cliente
  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ["cliente", "perfil", user?.id],
    enabled: isClienteLogado,
    queryFn: async (): Promise<Cliente | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, email, telefone, data_nascimento, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || undefined,
        dataNascimento: data.data_nascimento || undefined,
        createdAt: data.created_at,
      };
    },
  });

  // AGENDAMENTOS do cliente
  const { data: agendamentosRaw, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["cliente", "agendamentos", cliente?.id],
    enabled: !!cliente?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          `id, cliente_id, barbearia_id, servico_id, data, horario, status, observacao,
           created_at, updated_at, forma_pagamento,
           servico:servicos(id, nome, descricao, duracao, preco, barbearia_id, ativo),
           pagamentos(id, valor, metodo, status, created_at, updated_at)`
        )
        .eq("cliente_id", cliente!.id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const agendamentos: Agendamento[] = (agendamentosRaw || []).map((a: any) => ({
    id: a.id,
    clienteId: a.cliente_id,
    barbeariaId: a.barbearia_id,
    servicoId: a.servico_id,
    servico: a.servico
      ? {
          id: a.servico.id,
          nome: a.servico.nome,
          descricao: a.servico.descricao || undefined,
          duracao: a.servico.duracao,
          preco: Number(a.servico.preco),
          barbeariaId: a.servico.barbearia_id,
          ativo: a.servico.ativo,
        }
      : undefined,
    data: isoToDateOnly(a.data),
    hora: a.horario || "",
    status: a.status as StatusAgendamento,
    observacoes: a.observacao || undefined,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }));

  const pagamentos: Pagamento[] = (agendamentosRaw || [])
    .flatMap((a: any) =>
      (a.pagamentos || []).map((p: any) => ({
        id: p.id,
        agendamentoId: a.id,
        valor: Number(p.valor),
        metodo: p.metodo as MetodoPagamento,
        status: p.status as StatusPagamento,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    );

  // Fidelidade calculada
  const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
  const fidelidade = {
    pontos: concluidos * 10,
    nivel: concluidos >= 10 ? "Ouro" : concluidos >= 5 ? "Prata" : "Bronze",
    cortesRealizados: concluidos,
    proximoDesconto: {
      cortesNecessarios: 5 - (concluidos % 5) || 5,
      desconto: concluidos >= 10 ? 15 : concluidos >= 5 ? 10 : 5,
    },
    progressoProximoNivel: ((concluidos % 5) / 5) * 100,
  };

  const loading = authLoading || loadingCliente || loadingAgendamentos;

  const setCliente = (_c: Cliente | null) => {
    queryClient.invalidateQueries({ queryKey: ["cliente", "perfil"] });
  };

  const carregarDados = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cliente"] });
  };

  const atualizarPerfil = async (dados: Partial<Cliente>) => {
    if (!cliente) throw new Error("Cliente não carregado");
    const payload: any = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.telefone !== undefined) payload.telefone = dados.telefone;
    if (dados.dataNascimento !== undefined) payload.data_nascimento = dados.dataNascimento;
    if (dados.email !== undefined) payload.email = dados.email;
    const { error } = await supabase.from("clientes").update(payload).eq("id", cliente.id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["cliente", "perfil"] });
    toast.success("Perfil atualizado!");
  };

  const criarAgendamento = async (novo: NovoAgendamento): Promise<Agendamento> => {
    if (!cliente) {
      toast.error("Cadastro de cliente não encontrado. Faça login novamente.");
      throw new Error("Cliente não carregado");
    }
    const insertPayload = {
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      telefone: cliente.telefone || "",
      barbearia_id: novo.barbeariaId,
      servico_id: novo.servicoId,
      data: dateOnlyToNoonUtcIso(novo.data),
      horario: novo.hora,
      observacao: novo.observacoes || null,
      status: "pendente",
    };
    const { data, error } = await supabase
      .from("agendamentos")
      .insert(insertPayload)
      .select(
        `id, cliente_id, barbearia_id, servico_id, data, horario, status, observacao,
         created_at, updated_at,
         servico:servicos(id, nome, descricao, duracao, preco, barbearia_id, ativo)`
      )
      .single();
    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (novo.profissionalId) {
      await supabase
        .from("agendamento_profissional")
        .insert({ agendamento_id: data.id, profissional_id: novo.profissionalId });
    }

    await queryClient.invalidateQueries({ queryKey: ["cliente", "agendamentos"] });
    toast.success("Agendamento criado!");

    const s: any = data.servico;
    return {
      id: data.id,
      clienteId: data.cliente_id,
      barbeariaId: data.barbearia_id,
      servicoId: data.servico_id,
      servico: s
        ? {
            id: s.id,
            nome: s.nome,
            descricao: s.descricao || undefined,
            duracao: s.duracao,
            preco: Number(s.preco),
            barbeariaId: s.barbearia_id,
            ativo: s.ativo,
          }
        : undefined,
      data: isoToDateOnly(data.data),
      hora: data.horario || "",
      status: data.status as StatusAgendamento,
      observacoes: data.observacao || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  };

  const cancelarAgendamento = async (id: string) => {
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["cliente", "agendamentos"] });
    toast.success("Agendamento cancelado.");
  };

  const criarPagamento = async (
    agendamentoId: string,
    valor: number,
    metodo: MetodoPagamento
  ): Promise<Pagamento> => {
    const { data, error } = await supabase
      .from("pagamentos")
      .insert({
        agendamento_id: agendamentoId,
        valor,
        metodo,
        status: metodo === "dinheiro" ? "pendente" : "processando",
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["cliente", "agendamentos"] });
    return {
      id: data.id,
      agendamentoId,
      valor: Number(data.valor),
      metodo: data.metodo as MetodoPagamento,
      status: data.status as StatusPagamento,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  };

  const atualizarStatusPagamento = async (id: string, status: StatusPagamento) => {
    const { error } = await supabase.from("pagamentos").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    await queryClient.invalidateQueries({ queryKey: ["cliente", "agendamentos"] });
  };

  const realizarPagamento = async (agendamentoId: string, dados: any): Promise<Pagamento> => {
    return criarPagamento(agendamentoId, dados.valor, dados.metodo);
  };

  const getAgendamento = (id: string) => agendamentos.find((a) => a.id === id);
  const getAgendamentosPorStatus = (status: StatusAgendamento) =>
    agendamentos.filter((a) => a.status === status);
  const getServicosPorBarbearia = (_barbeariaId: string): Servico[] => [];

  const getProximoAgendamento = (): Agendamento | null => {
    const agora = new Date();
    const futuros = agendamentos
      .filter((a) => {
        const d = new Date(`${a.data}T${a.hora || "00:00"}`);
        return d > agora && a.status !== "cancelado";
      })
      .sort(
        (x, y) =>
          new Date(`${x.data}T${x.hora}`).getTime() -
          new Date(`${y.data}T${y.hora}`).getTime()
      );
    return futuros[0] || null;
  };

  const buscarBarbearias = async (busca?: string, cidade?: string, bairro?: string) => {
    let q = supabase
      .from("barbearias")
      .select(
        `id, nome, telefone, email, foto, bairro, cidade, endereco,
         servicos(id, nome, descricao, duracao, preco, ativo, barbearia_id),
         profissionais(id, nome, foto, especialidades, ativo, barbearia_id)`
      )
      .order("nome");
    if (busca) q = q.ilike("nome", `%${busca}%`);
    if (cidade) q = q.ilike("cidade", `%${cidade}%`);
    if (bairro) q = q.ilike("bairro", `%${bairro}%`);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setBarbearias([]);
      return;
    }
    const mapped = (data || []).map((b: any) => ({
      ...b,
      servicos: (b.servicos || []).filter((s: any) => s.ativo).map((s: any) => ({
        ...s,
        preco: Number(s.preco),
      })),
      profissionais: (b.profissionais || []).filter((p: any) => p.ativo),
      totalServicos: (b.servicos || []).filter((s: any) => s.ativo).length,
    }));
    setBarbearias(mapped);
  };

  const buscarBarbeariaPorId = async (id: string) => {
    const { data, error } = await supabase
      .from("barbearias")
      .select(
        `id, nome, telefone, email, foto, bairro, cidade, endereco,
         servicos(id, nome, descricao, duracao, preco, ativo, barbearia_id),
         profissionais(id, nome, foto, especialidades, ativo, barbearia_id)`
      )
      .eq("id", id)
      .single();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    const b: any = data;
    return {
      ...b,
      servicos: (b.servicos || []).filter((s: any) => s.ativo).map((s: any) => ({
        ...s,
        preco: Number(s.preco),
      })),
      profissionais: (b.profissionais || []).filter((p: any) => p.ativo),
    };
  };

  return (
    <ClienteContext.Provider
      value={{
        cliente: cliente ?? null,
        agendamentos,
        servicos: [],
        pagamentos,
        loading,
        setCliente,
        criarAgendamento,
        cancelarAgendamento,
        criarPagamento,
        atualizarStatusPagamento,
        getAgendamento,
        getAgendamentosPorStatus,
        getServicosPorBarbearia,
        carregarDados,
        atualizarPerfil,
        getProximoAgendamento,
        fidelidade,
        notificacoes,
        barbearias,
        buscarBarbearias,
        buscarBarbeariaPorId,
        realizarPagamento,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente deve ser usado dentro de ClienteProvider");
  return ctx;
}
