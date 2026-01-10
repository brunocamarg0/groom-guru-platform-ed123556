import { createContext, useContext, useState, ReactNode } from "react";
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

interface ClienteContextType {
  cliente: Cliente | null;
  agendamentos: Agendamento[];
  servicos: Servico[];
  pagamentos: Pagamento[];
  setCliente: (cliente: Cliente | null) => void;
  criarAgendamento: (agendamento: NovoAgendamento) => Agendamento;
  cancelarAgendamento: (id: string) => void;
  criarPagamento: (
    agendamentoId: string,
    valor: number,
    metodo: MetodoPagamento
  ) => Pagamento;
  atualizarStatusPagamento: (id: string, status: StatusPagamento) => void;
  getAgendamento: (id: string) => Agendamento | undefined;
  getServicosPorBarbearia: (barbeariaId: string) => Servico[];
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

// Mock data para serviços
// Preços em R$ 0,01 para testes de pagamento
const servicosMock: Servico[] = [
  {
    id: "1",
    nome: "Corte Masculino",
    descricao: "Corte moderno com acabamento profissional",
    duracao: 30,
    preco: 0.01, // R$ 0,01 para testes
    barbeariaId: "1",
    ativo: true,
  },
  {
    id: "2",
    nome: "Barba Completa",
    descricao: "Aparar, desenhar e modelar barba",
    duracao: 25,
    preco: 0.01, // R$ 0,01 para testes
    barbeariaId: "1",
    ativo: true,
  },
  {
    id: "3",
    nome: "Corte + Barba",
    descricao: "Pacote completo - Corte e barba",
    duracao: 45,
    preco: 0.01, // R$ 0,01 para testes
    barbeariaId: "1",
    ativo: true,
  },
  {
    id: "4",
    nome: "Sobrancelha",
    descricao: "Design e modelagem de sobrancelhas",
    duracao: 15,
    preco: 0.01, // R$ 0,01 para testes
    barbeariaId: "1",
    ativo: true,
  },
  {
    id: "5",
    nome: "Relaxamento Capilar",
    descricao: "Tratamento completo para cabelos",
    duracao: 60,
    preco: 0.01, // R$ 0,01 para testes
    barbeariaId: "1",
    ativo: true,
  },
];

// Mock data para cliente
const clienteMock: Cliente = {
  id: "1",
  nome: "João Silva",
  email: "joao@example.com",
  telefone: "(11) 98765-4321",
  cpf: "123.456.789-00",
  dataNascimento: "1990-01-15",
  createdAt: new Date().toISOString(),
};

// Mock data para agendamentos
const agendamentosMock: Agendamento[] = [
  {
    id: "1",
    clienteId: "1",
    barbeariaId: "1",
    servicoId: "3",
    servico: servicosMock[2],
    data: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    hora: "14:00",
    status: "confirmado",
    observacoes: "Primeira vez nesta barbearia",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    clienteId: "1",
    barbeariaId: "1",
    servicoId: "1",
    servico: servicosMock[0],
    data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    hora: "10:00",
    status: "concluido",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock data para pagamentos
const pagamentosMock: Pagamento[] = [
  {
    id: "1",
    agendamentoId: "2",
    valor: 0.01, // R$ 0,01 para testes
    metodo: "cartao_credito",
    status: "aprovado",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(clienteMock);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(agendamentosMock);
  const [servicos] = useState<Servico[]>(servicosMock);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(pagamentosMock);

  const criarAgendamento = (novoAgendamento: NovoAgendamento): Agendamento => {
    const servico = servicos.find((s) => s.id === novoAgendamento.servicoId);
    if (!servico) {
      throw new Error("Serviço não encontrado");
    }

    const agendamento: Agendamento = {
      id: Date.now().toString(),
      ...novoAgendamento,
      servico,
      clienteId: cliente?.id || "1",
      status: "pagamento_pendente",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAgendamentos([...agendamentos, agendamento]);
    return agendamento;
  };

  const cancelarAgendamento = (id: string) => {
    setAgendamentos(
      agendamentos.map((a) =>
        a.id === id ? { ...a, status: "cancelado" as StatusAgendamento, updatedAt: new Date().toISOString() } : a
      )
    );
  };

  const criarPagamento = (
    agendamentoId: string,
    valor: number,
    metodo: MetodoPagamento
  ): Pagamento => {
    const pagamento: Pagamento = {
      id: Date.now().toString(),
      agendamentoId,
      valor,
      metodo,
      status: metodo === "pix" || metodo === "boleto" ? "pendente" : "processando",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPagamentos([...pagamentos, pagamento]);

    // Atualizar status do agendamento
    setAgendamentos(
      agendamentos.map((a) =>
        a.id === agendamentoId
          ? { ...a, status: "confirmado" as StatusAgendamento, updatedAt: new Date().toISOString() }
          : a
      )
    );

    return pagamento;
  };

  const atualizarStatusPagamento = (id: string, status: StatusPagamento) => {
    setPagamentos(
      pagamentos.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      )
    );

    const pagamento = pagamentos.find((p) => p.id === id);
    if (pagamento && status === "aprovado") {
      setAgendamentos(
        agendamentos.map((a) =>
          a.id === pagamento.agendamentoId
            ? { ...a, status: "confirmado" as StatusAgendamento, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
  };

  const getAgendamento = (id: string): Agendamento | undefined => {
    return agendamentos.find((a) => a.id === id);
  };

  const getServicosPorBarbearia = (barbeariaId: string): Servico[] => {
    return servicos.filter((s) => s.barbeariaId === barbeariaId && s.ativo);
  };

  return (
    <ClienteContext.Provider
      value={{
        cliente,
        agendamentos,
        servicos,
        pagamentos,
        setCliente,
        criarAgendamento,
        cancelarAgendamento,
        criarPagamento,
        atualizarStatusPagamento,
        getAgendamento,
        getServicosPorBarbearia,
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

