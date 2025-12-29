export type StatusAgendamento = "confirmado" | "aguardando_pagamento" | "concluido" | "cancelado" | "reagendado";

export type TipoServico = "corte" | "barba" | "combo" | "outro";

export type MetodoPagamento = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro" | "creditos";

export type StatusPagamento = "pago" | "pendente" | "cancelado" | "reembolsado";

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  foto?: string;
  dataNascimento?: string;
  preferencias: {
    profissionalFavorito?: string;
    servicoPreferido?: TipoServico;
  };
  pontosFidelidade: number;
  creditos: number;
  dataCadastro: string;
}

export interface Agendamento {
  id: string;
  clienteId: string;
  barbeariaId: string;
  barbeariaNome: string;
  profissionalId: string;
  profissionalNome: string;
  servico: TipoServico;
  servicoNome: string;
  data: string;
  horario: string;
  duracao: number; // em minutos
  valor: number;
  status: StatusAgendamento;
  pagamento?: Pagamento;
  avaliacao?: Avaliacao;
  observacoes?: string;
  dataCriacao: string;
}

export interface NovoAgendamento {
  barbeariaId: string;
  profissionalId: string;
  servico: TipoServico;
  data: string;
  horario: string;
  observacoes?: string;
}

export interface Pagamento {
  id: string;
  agendamentoId: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  transacaoId?: string;
  dataPagamento?: string;
  cupomDesconto?: string;
  cashbackGerado?: number;
}

export interface Avaliacao {
  id: string;
  agendamentoId: string;
  profissionalId: string;
  notaProfissional: number; // 1-5
  notaAtendimento: number; // 1-5
  notaAmbiente: number; // 1-5
  comentario?: string;
  data: string;
}

export interface NotificacaoCliente {
  id: string;
  clienteId: string;
  tipo: "agendamento" | "lembrete" | "promocao" | "pagamento" | "sistema";
  titulo: string;
  mensagem: string;
  lida: boolean;
  data: string;
  canal?: "app" | "email" | "whatsapp";
}

export interface ProgramaFidelidade {
  id: string;
  clienteId: string;
  pontos: number;
  cortesRealizados: number;
  nivel: "bronze" | "prata" | "ouro" | "diamante";
  proximoDesconto: {
    cortesNecessarios: number;
    desconto: number; // percentual
  };
}

export interface Cupom {
  id: string;
  codigo: string;
  descricao: string;
  desconto: number; // percentual ou valor fixo
  tipo: "percentual" | "fixo";
  validoAte?: string;
  usado: boolean;
}

