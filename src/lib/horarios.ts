// Geração de slots de horário respeitando o horário de funcionamento da barbearia
// e a duração do serviço.

export type DiaSemana =
  | "domingo"
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado";

export interface DiaFuncionamento {
  aberto: boolean;
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
}

export type HorarioFuncionamento = Record<DiaSemana, DiaFuncionamento>;

const DIAS_ORDEM: DiaSemana[] = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

export const FALLBACK_HORARIO: HorarioFuncionamento = {
  segunda: { aberto: true, inicio: "09:00", fim: "19:00" },
  terca: { aberto: true, inicio: "09:00", fim: "19:00" },
  quarta: { aberto: true, inicio: "09:00", fim: "19:00" },
  quinta: { aberto: true, inicio: "09:00", fim: "19:00" },
  sexta: { aberto: true, inicio: "09:00", fim: "19:00" },
  sabado: { aberto: true, inicio: "09:00", fim: "17:00" },
  domingo: { aberto: false, inicio: "09:00", fim: "13:00" },
};

export function parseHorarioFuncionamento(raw: any): HorarioFuncionamento {
  if (!raw) return FALLBACK_HORARIO;
  if (typeof raw === "string") {
    try {
      return { ...FALLBACK_HORARIO, ...JSON.parse(raw) };
    } catch {
      return FALLBACK_HORARIO;
    }
  }
  return { ...FALLBACK_HORARIO, ...raw } as HorarioFuncionamento;
}

// "YYYY-MM-DD" -> DiaSemana (sem bug de fuso)
export function diaSemanaDaData(dataISO: string): DiaSemana | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return null;
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
  return DIAS_ORDEM[d.getUTCDay()];
}

function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutosParaHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Gera todos os horários possíveis em que um serviço pode iniciar dentro do
 * intervalo de funcionamento do dia, garantindo que o serviço termine antes
 * (ou exatamente) do horário de fechamento.
 */
export function gerarHorariosDoDia(
  horarioFuncionamento: HorarioFuncionamento,
  dataISO: string,
  duracaoServicoMin = 40,
  passoMin = 30
): string[] {
  const dia = diaSemanaDaData(dataISO);
  if (!dia) return [];
  const cfg = horarioFuncionamento[dia];
  if (!cfg || !cfg.aberto) return [];

  const inicio = hhmmParaMinutos(cfg.inicio);
  const fim = hhmmParaMinutos(cfg.fim);
  if (fim <= inicio) return [];

  const passo = Math.max(passoMin, Math.min(duracaoServicoMin, 60));
  const result: string[] = [];
  for (let t = inicio; t + duracaoServicoMin <= fim; t += passo) {
    result.push(minutosParaHHMM(t));
  }
  return result;
}

/**
 * Retorna true se um horário (HH:MM) está dentro do funcionamento do dia.
 */
export function horarioDentroDoFuncionamento(
  horarioFuncionamento: HorarioFuncionamento,
  dataISO: string,
  horario: string,
  duracaoServicoMin = 40
): boolean {
  const dia = diaSemanaDaData(dataISO);
  if (!dia) return false;
  const cfg = horarioFuncionamento[dia];
  if (!cfg || !cfg.aberto) return false;
  const inicio = hhmmParaMinutos(cfg.inicio);
  const fim = hhmmParaMinutos(cfg.fim);
  const h = hhmmParaMinutos(horario);
  return h >= inicio && h + duracaoServicoMin <= fim;
}

/**
 * Verifica se o cancelamento/reagendamento respeita o prazo mínimo (em horas)
 * antes do início do agendamento.
 */
export function podeAlterarAgendamento(
  dataISO: string,
  horario: string,
  prazoMinimoHoras = 2
): { ok: boolean; horasRestantes: number } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO) || !/^\d{2}:\d{2}/.test(horario)) {
    return { ok: false, horasRestantes: 0 };
  }
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const [h, m] = horario.split(":").map(Number);
  // Local time: assume HH:MM no fuso do navegador (consistente com input do usuário).
  const alvo = new Date(ano, mes - 1, dia, h, m, 0).getTime();
  const agora = Date.now();
  const horasRestantes = (alvo - agora) / (1000 * 60 * 60);
  return { ok: horasRestantes >= prazoMinimoHoras, horasRestantes };
}
