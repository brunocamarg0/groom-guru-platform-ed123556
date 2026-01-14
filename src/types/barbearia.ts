export type StatusBarbearia = "ativa" | "em_teste" | "bloqueada" | "cancelada";

export type PlanoContratado = "basico" | "premium" | "enterprise";

export interface GatewayPagamento {
  nome: string;
  conectado: boolean;
  dataConexao?: string;
}

export interface ServicoBarbearia {
  id: string;
  tipo: string; // TipoServico
  nome: string;
  descricao?: string;
  duracao: number; // em minutos
  valor: number;
  ativo: boolean;
  ordem?: number; // para ordenação na lista
}

export interface Barbearia {
  id: string;
  nome: string;
  cnpjCpf: string;
  responsavel: string;
  plano: PlanoContratado;
  status: StatusBarbearia;
  dataCriacao: string;
  dataVencimento: string;
  gatewayPagamento: GatewayPagamento;
  servicos: ServicoBarbearia[]; // Serviços disponíveis nesta barbearia
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
}

export interface NovaBarbearia {
  nome: string;
  cnpjCpf: string;
  responsavel: string;
  plano: PlanoContratado;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
}

export interface NovoServicoBarbearia {
  tipo: string;
  nome: string;
  descricao?: string;
  duracao: number;
  valor: number;
  ativo: boolean;
  ordem?: number;
}