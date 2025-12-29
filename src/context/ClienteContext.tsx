import { createContext, useContext, useState, ReactNode } from "react";
import {
  Cliente,
  Agendamento,
  NovoAgendamento,
  Pagamento,
  Avaliacao,
  NotificacaoCliente,
  ProgramaFidelidade,
  Cupom,
  StatusAgendamento,
} from "@/types/cliente";
import { Profissional, Servico } from "@/types/barbearia-cliente";

interface ClienteContextType {
  cliente: Cliente;
  agendamentos: Agendamento[];
  notificacoes: NotificacaoCliente[];
  fidelidade: ProgramaFidelidade;
  cupons: Cupom[];
  criarAgendamento: (agendamento: NovoAgendamento) => void;
  cancelarAgendamento: (id: string) => void;
  reagendarAgendamento: (id: string, novaData: string, novoHorario: string) => void;
  realizarPagamento: (agendamentoId: string, pagamento: Omit<Pagamento, "id" | "agendamentoId">) => void;
  criarAvaliacao: (avaliacao: Omit<Avaliacao, "id" | "data">) => void;
  marcarNotificacaoLida: (id: string) => void;
  atualizarPerfil: (dados: Partial<Cliente>) => void;
  getProximoAgendamento: () => Agendamento | undefined;
  getAgendamentosPorStatus: (status: StatusAgendamento) => Agendamento[];
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

// Cliente mockado
const clienteInicial: Cliente = {
  id: "1",
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-9999",
  pontosFidelidade: 150,
  creditos: 25.50,
  dataCadastro: "2024-01-15",
  preferencias: {
    profissionalFavorito: "1",
    servicoPreferido: "combo",
  },
};

// Agendamentos mockados
const agendamentosIniciais: Agendamento[] = [
  {
    id: "1",
    clienteId: "1",
    barbeariaId: "1",
    barbeariaNome: "Barbearia do João",
    profissionalId: "1",
    profissionalNome: "Carlos Barbeiro",
    servico: "combo",
    servicoNome: "Corte + Barba",
    data: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split("T")[0], // 2 horas no futuro
    horario: "14:00",
    duracao: 60,
    valor: 45.00,
    status: "confirmado",
    dataCriacao: new Date().toISOString(),
  },
  {
    id: "2",
    clienteId: "1",
    barbeariaId: "1",
    barbeariaNome: "Barbearia do João",
    profissionalId: "1",
    profissionalNome: "Carlos Barbeiro",
    servico: "corte",
    servicoNome: "Corte Masculino",
    data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 dias atrás
    horario: "10:00",
    duracao: 30,
    valor: 25.00,
    status: "concluido",
    pagamento: {
      id: "p1",
      agendamentoId: "2",
      valor: 25.00,
      metodo: "pix",
      status: "pago",
      dataPagamento: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    avaliacao: {
      id: "a1",
      agendamentoId: "2",
      profissionalId: "1",
      notaProfissional: 5,
      notaAtendimento: 5,
      notaAmbiente: 4,
      comentario: "Excelente atendimento!",
      data: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    dataCriacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const notificacoesIniciais: NotificacaoCliente[] = [
  {
    id: "1",
    clienteId: "1",
    tipo: "lembrete",
    titulo: "Lembrete de Agendamento",
    mensagem: "Você tem um agendamento hoje às 14:00",
    lida: false,
    data: new Date().toISOString(),
    canal: "app",
  },
  {
    id: "2",
    clienteId: "1",
    tipo: "promocao",
    titulo: "Promoção Especial",
    mensagem: "Ganhe 20% de desconto no próximo corte!",
    lida: false,
    data: new Date(Date.now() - 86400000).toISOString(),
    canal: "app",
  },
];

const fidelidadeInicial: ProgramaFidelidade = {
  id: "1",
  clienteId: "1",
  pontos: 150,
  cortesRealizados: 3,
  nivel: "bronze",
  proximoDesconto: {
    cortesNecessarios: 2,
    desconto: 20,
  },
};

const cuponsIniciais: Cupom[] = [
  {
    id: "1",
    codigo: "BEMVINDO20",
    descricao: "20% de desconto",
    desconto: 20,
    tipo: "percentual",
    usado: false,
  },
];

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente>(clienteInicial);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(agendamentosIniciais);
  const [notificacoes, setNotificacoes] = useState<NotificacaoCliente[]>(notificacoesIniciais);
  const [fidelidade, setFidelidade] = useState<ProgramaFidelidade>(fidelidadeInicial);
  const [cupons, setCupons] = useState<Cupom[]>(cuponsIniciais);

  const criarAgendamento = (novoAgendamento: NovoAgendamento) => {
    const agendamento: Agendamento = {
      id: Date.now().toString(),
      ...novoAgendamento,
      clienteId: cliente.id,
      barbeariaNome: "Barbearia do João", // Mock
      profissionalNome: "Carlos Barbeiro", // Mock
      servicoNome: novoAgendamento.servico === "corte" ? "Corte Masculino" : novoAgendamento.servico === "barba" ? "Barba" : "Combo",
      duracao: novoAgendamento.servico === "combo" ? 60 : 30,
      valor: novoAgendamento.servico === "combo" ? 45 : 25,
      status: "aguardando_pagamento",
      dataCriacao: new Date().toISOString(),
    };
    setAgendamentos([agendamento, ...agendamentos]);
  };

  const cancelarAgendamento = (id: string) => {
    setAgendamentos(
      agendamentos.map((a) => (a.id === id ? { ...a, status: "cancelado" } : a))
    );
  };

  const reagendarAgendamento = (id: string, novaData: string, novoHorario: string) => {
    setAgendamentos(
      agendamentos.map((a) =>
        a.id === id
          ? { ...a, data: novaData, horario: novoHorario, status: "reagendado" }
          : a
      )
    );
  };

  const realizarPagamento = (agendamentoId: string, pagamento: Omit<Pagamento, "id" | "agendamentoId">) => {
    const novoPagamento: Pagamento = {
      id: Date.now().toString(),
      agendamentoId,
      ...pagamento,
    };

    setAgendamentos(
      agendamentos.map((a) => {
        if (a.id === agendamentoId) {
          return {
            ...a,
            pagamento: novoPagamento,
            status: pagamento.status === "pago" ? "confirmado" : a.status,
          };
        }
        return a;
      })
    );

    // Adicionar cashback aos créditos se houver
    if (pagamento.cashbackGerado) {
      setCliente({
        ...cliente,
        creditos: cliente.creditos + (pagamento.cashbackGerado || 0),
      });
    }
  };

  const criarAvaliacao = (avaliacao: Omit<Avaliacao, "id" | "data">) => {
    const nova: Avaliacao = {
      id: Date.now().toString(),
      ...avaliacao,
      data: new Date().toISOString(),
    };

    setAgendamentos(
      agendamentos.map((a) =>
        a.id === avaliacao.agendamentoId ? { ...a, avaliacao: nova } : a
      )
    );

    // Atualizar pontos de fidelidade
    setFidelidade({
      ...fidelidade,
      pontos: fidelidade.pontos + 10, // 10 pontos por avaliação
    });
  };

  const marcarNotificacaoLida = (id: string) => {
    setNotificacoes(
      notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const atualizarPerfil = (dados: Partial<Cliente>) => {
    setCliente({ ...cliente, ...dados });
  };

  const getProximoAgendamento = () => {
    const agora = new Date();
    return agendamentos
      .filter(
        (a) =>
          (a.status === "confirmado" || a.status === "aguardando_pagamento") &&
          new Date(`${a.data}T${a.horario}`) > agora
      )
      .sort((a, b) => {
        const dataA = new Date(`${a.data}T${a.horario}`);
        const dataB = new Date(`${b.data}T${b.horario}`);
        return dataA.getTime() - dataB.getTime();
      })[0];
  };

  const getAgendamentosPorStatus = (status: StatusAgendamento) => {
    return agendamentos.filter((a) => a.status === status);
  };

  return (
    <ClienteContext.Provider
      value={{
        cliente,
        agendamentos,
        notificacoes,
        fidelidade,
        cupons,
        criarAgendamento,
        cancelarAgendamento,
        reagendarAgendamento,
        realizarPagamento,
        criarAvaliacao,
        marcarNotificacaoLida,
        atualizarPerfil,
        getProximoAgendamento,
        getAgendamentosPorStatus,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error("useCliente deve ser usado dentro de ClienteProvider");
  }
  return context;
}

