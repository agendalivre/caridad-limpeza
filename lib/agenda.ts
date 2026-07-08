// Disponibilidade: regra do negócio de Caridad = NO MÁXIMO 1 serviço por dia
// (mesmo curto). Se o dia já tem um serviço, o dia inteiro fica indisponível.
// Caso contrário, sugere horários de início (a hora é só quando ela começa).

export type BlocoOcupado = { data: string; inicio: string | null; horas: number };

export const JORNADA_INICIO = 8; // 08:00
export const JORNADA_FIM = 19; // último horário de término

const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const isoLocal = (d: Date) => d.toLocaleDateString("sv-SE");

/**
 * Datas futuras geradas por uma recorrência, a partir de `dataBase` (exclusive)
 * até `horizonteDias`. semanal +7, quinzenal +14, mensal +1 mês.
 * pontual/desconhecida -> []. Assim o calendário e a disponibilidade "veem" os
 * dias que um cliente fixo já ocupa lá na frente (estilo Parafuzo).
 */
export function ocorrenciasRecorrentes(
  dataBase: string,
  recorrencia: string | null,
  horizonteDias = 120
): string[] {
  if (!dataBase || !recorrencia || recorrencia === "pontual") return [];
  const base = new Date(dataBase + "T00:00:00");
  if (isNaN(base.getTime())) return [];
  const limite = new Date(base);
  limite.setDate(limite.getDate() + horizonteDias);

  const out: string[] = [];
  const d = new Date(base);
  for (let i = 0; i < 60; i++) {
    if (recorrencia === "mensal") d.setMonth(d.getMonth() + 1);
    else if (recorrencia === "quinzenal") d.setDate(d.getDate() + 14);
    else if (recorrencia === "semanal") d.setDate(d.getDate() + 7);
    else break;
    if (d > limite) break;
    out.push(isoLocal(d));
  }
  return out;
}

/** O dia já tem algum serviço? (regra: 1 serviço por dia). */
export function diaOcupado(dataSel: string, ocupado: BlocoOcupado[]): boolean {
  return !!dataSel && ocupado.some((o) => o.data === dataSel);
}

/**
 * Horários de início sugeridos para `dataSel`.
 * - Se o dia já está ocupado -> [] (1 serviço por dia).
 * - Se está livre -> horários de hora em hora na jornada 08:00–19:00.
 *   A hora é só o INÍCIO; serviços longos Caridad organiza (até 2 dias), por isso
 *   a duração é limitada à jornada só para calcular o último início possível.
 */
export function slotsDisponiveis(
  dataSel: string,
  horasServico: number,
  ocupado: BlocoOcupado[]
): string[] {
  if (!dataSel || diaOcupado(dataSel, ocupado)) return [];

  const dur = Math.max(1, horasServico) * 60;
  const janela = (JORNADA_FIM - JORNADA_INICIO) * 60;
  const durEncaixe = Math.min(dur, janela);

  const hojeISO = new Date().toLocaleDateString("sv-SE");
  const agoraMin =
    dataSel === hojeISO ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  const slots: string[] = [];
  for (let ini = JORNADA_INICIO * 60; ini + durEncaixe <= JORNADA_FIM * 60; ini += 60) {
    if (ini <= agoraMin) continue; // hoje: só horários futuros
    slots.push(toHHMM(ini));
  }
  return slots;
}
