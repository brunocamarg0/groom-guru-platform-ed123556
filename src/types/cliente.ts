export type StatusAgendamento = 
  | "pendente" 
  | "confirmado" 
  | "concluido" 
  | "cancelado" 
  | "pagamento_pendente"
  | "pago";

export type StatusPagamento = 
  | "pendente" 
  | "processando" 
  | "aprovado" 
  | "recusado" 
  | "reembolsado";

export type MetodoPagamento = 
  | "cartao_credito" 
  | "cartao_debito" 
  | "pix" 
  | "boleto" 
  | "dinheiro";

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  duracao: number; // em minutos
  preco: number;
  barbeariaId: string;
  ativo: boolean;
}

export interface Agendamento {
  id: string;
  clienteId: string;
  barbeariaId: string;
  servicoId: string;
  servico: Servico;
  data: string; // ISO date string
  hora: string; // HH:mm format
  status: StatusAgendamento;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagamento {
  id: string;
  agendamentoId: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  stripePaymentIntentId?: string; // ID do Stripe
  pixQrCode?: string; // Para pagamento PIX
  pixExpiresAt?: string; // Data de expiração do PIX
  boletoUrl?: string; // URL do boleto
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  createdAt: string;
}

export interface NovoAgendamento {
  servicoId: string;
  barbeariaId: string;
  data: string;
  hora: string;
  observacoes?: string;
}

