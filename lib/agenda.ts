// Disponibilidade: regra do negócio de Caridad = NO MÁXIMO 1 serviço por dia
// (mesmo curto). Se o dia já tem um serviço, o dia inteiro fica indisponível.
// Caso contrário, sugere horários de início (a hora é só quando ela começa).

export type BlocoOcupado = { data: string; inicio: string | null; horas: number };

export const JORNADA_INICIO = 8; // 08:00
export const JORNADA_FIM = 19; // último horário de término

const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

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
