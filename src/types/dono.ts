// Tipos para o painel do dono da barbearia

export interface KPI {
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  agendamentosHoje: number;
  cancelamentos: number;
  clientesRecorrentes: number;
  notaMedia: number;
  totalAvaliacoes?: number;
  variacaoHoje?: number;
  variacaoSemana?: number;
  variacaoMes?: number;
}

export interface AgendamentoDono {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone?: string;
  profissionalId: string;
  profissionalNome: string;
  servicoId: string;
  servicoNome: string;
  data: string;
  horario: string;
  duracao: number;
  valor: number;
  status: "confirmado" | "pendente" | "cancelado" | "recusado" | "concluido" | "faltou";
  observacoes?: string;
  dataCriacao: string;
}

export interface ProfissionalDono {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  foto?: string;
  especialidades: string[];
  comissao: {
    tipo: "percentual" | "fixo";
    valor: number; // % ou valor fixo
  };
  ativo: boolean;
  dataAdmissao: string;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  faturamentoTotal: number;
  faltas: number;
}

export interface ClienteDono {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  foto?: string;
  dataNascimento?: string;
  vip: boolean;
  totalAgendamentos: number;
  ultimoAgendamento?: string;
  ticketMedio: number;
  frequencia: number; // agendamentos por mês
  anotacoes?: string;
  dataCadastro: string;
}

export interface PagamentoDono {
  id: string;
  agendamentoId: string;
  valor: number;
  metodo: "pix" | "cartao_credito" | "cartao_debito" | "dinheiro";
  status: "pago" | "pendente" | "reembolsado";
  taxaGateway?: number;
  dataPagamento?: string;
  dataVencimento?: string;
}

export interface PromocaoDono {
  id: string;
  nome: string;
  tipo: "desconto_percentual" | "desconto_fixo" | "cashback" | "pontos";
  valor: number;
  validoDe: string;
  validoAte: string;
  ativo: boolean;
  aplicavelA: "todos" | "servico" | "horario" | "cliente_vip";
  servicoId?: string;
  horarioInicio?: string;
  horarioFim?: string;
}

export interface AvaliacaoDono {
  id: string;
  agendamentoId: string;
  clienteId: string;
  clienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  notaProfissional: number;
  notaAtendimento: number;
  notaAmbiente: number;
  comentario?: string;
  resposta?: string;
  data: string;
}

export interface ProdutoDono {
  id: string;
  nome: string;
  descricao?: string;
  categoria: "pomada" | "oleo" | "kit" | "outro";
  preco: number;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  foto?: string;
}

export interface NotificacaoDono {
  id: string;
  tipo: "agendamento" | "pagamento" | "avaliacao" | "estoque" | "sistema";
  titulo: string;
  mensagem: string;
  lida: boolean;
  data: string;
  acao?: {
    url: string;
    label: string;
  };
}

export interface ConfiguracaoBarbearia {
  id: string;
  nome: string;
  cnpjCpf: string;
  logo?: string;
  foto?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  modoConfirmacao?: "automatico" | "manual" | "hibrido";
  horarioFuncionamento: {
    segunda: { aberto: boolean; inicio: string; fim: string };
    terca: { aberto: boolean; inicio: string; fim: string };
    quarta: { aberto: boolean; inicio: string; fim: string };
    quinta: { aberto: boolean; inicio: string; fim: string };
    sexta: { aberto: boolean; inicio: string; fim: string };
    sabado: { aberto: boolean; inicio: string; fim: string };
    domingo: { aberto: boolean; inicio: string; fim: string };
  };
  politicaCancelamento: {
    prazoMinimo: number; // horas antes
    multa?: number;
    permitirReagendamento: boolean;
  };
  linkAgendamento: string;
  paginaPublica: boolean;
}

export interface RelatorioDono {
  periodo: string;
  faturamento: number;
  agendamentos: number;
  cancelamentos: number;
  taxaCancelamento: number;
  ticketMedio: number;
  servicosMaisVendidos: Array<{ servico: string; quantidade: number; receita: number }>;
  profissionaisMaisRentaveis: Array<{ profissional: string; receita: number }>;
  horariosPico: Array<{ horario: string; quantidade: number }>;
}







