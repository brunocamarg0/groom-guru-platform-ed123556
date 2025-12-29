export interface Profissional {
  id: string;
  barbeariaId: string;
  nome: string;
  foto?: string;
  especialidades: string[];
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  disponivel: boolean;
}

export interface Servico {
  id: string;
  barbeariaId: string;
  nome: string;
  tipo: "corte" | "barba" | "combo" | "outro";
  descricao?: string;
  duracao: number; // em minutos
  valor: number;
  ativo: boolean;
}

export interface HorarioDisponivel {
  horario: string;
  disponivel: boolean;
  profissionalId?: string;
}

export interface DiaDisponivel {
  data: string;
  horarios: HorarioDisponivel[];
}

