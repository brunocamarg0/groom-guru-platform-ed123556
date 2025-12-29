export interface RecursoPlano {
  id: string;
  nome: string;
  descricao?: string;
}

export interface Plano {
  id: string;
  nome: string;
  descricao?: string;
  valorMensal: number;
  limiteBarbeiros: number;
  limiteAgendamentos: number;
  recursos: RecursoPlano[];
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao?: string;
}

export interface NovoPlano {
  nome: string;
  descricao?: string;
  valorMensal: number;
  limiteBarbeiros: number;
  limiteAgendamentos: number;
  recursos: RecursoPlano[];
}

export type StatusAssinatura = "em_dia" | "atrasado" | "cancelado" | "vencido";

export interface Pagamento {
  id: string;
  valor: number;
  dataPagamento: string;
  dataVencimento: string;
  status: "pago" | "pendente" | "atrasado" | "cancelado";
  metodoPagamento?: string;
  transacaoId?: string;
}

export interface Assinatura {
  id: string;
  barbeariaId: string;
  barbeariaNome: string;
  planoId: string;
  planoNome: string;
  status: StatusAssinatura;
  dataInicio: string;
  dataVencimento: string;
  proximoVencimento: string;
  valorMensal: number;
  pagamentos: Pagamento[];
  dataCancelamento?: string;
  motivoCancelamento?: string;
}

export interface NovaAssinatura {
  barbeariaId: string;
  planoId: string;
  dataInicio: string;
}

export interface TrocaPlano {
  assinaturaId: string;
  novoPlanoId: string;
  dataEfetivacao: string;
}

