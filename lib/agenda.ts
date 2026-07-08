// Disponibilidade: calcula horários livres do dia a partir dos blocos ocupados
// da agenda de Caridad (via edge function pública /disponibilidade).

export type BlocoOcupado = { data: string; inicio: string | null; horas: number };

export const JORNADA_INICIO = 8; // 08:00
export const JORNADA_FIM = 19; // último horário de término
export const BUFFER_H = 1; // deslocamento entre serviços

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/**
 * Horários de início livres para `dataSel`, dado que o serviço dura `horasServico`.
 * Slots de hora em hora, jornada 08:00–19:00, com 1h de buffer entre serviços.
 */
export function slotsDisponiveis(
  dataSel: string,
  horasServico: number,
  ocupado: BlocoOcupado[]
): string[] {
  if (!dataSel) return [];
  const doDia = ocupado.filter((o) => o.data === dataSel && o.inicio);
  const dur = Math.max(1, horasServico) * 60; // duração real — usada para não sobrepor
  const buffer = BUFFER_H * 60;

  // O horário escolhido é só o INÍCIO; serviços longos Caridad organiza (até 2 dias).
  // Por isso o último início possível usa a duração limitada à jornada, senão um
  // serviço de +11h nunca caberia e o dia (mesmo vazio) apareceria sem horários.
  const janela = (JORNADA_FIM - JORNADA_INICIO) * 60;
  const durEncaixe = Math.min(dur, janela);

  const hojeISO = new Date().toLocaleDateString("sv-SE");
  const agoraMin =
    dataSel === hojeISO ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  const slots: string[] = [];
  for (let ini = JORNADA_INICIO * 60; ini + durEncaixe <= JORNADA_FIM * 60; ini += 60) {
    if (ini <= agoraMin) continue; // hoje: só horários futuros
    const fim = ini + dur;
    const livre = doDia.every((o) => {
      const oIni = toMin((o.inicio as string).slice(0, 5));
      const oFim = oIni + o.horas * 60;
      return fim + buffer <= oIni || ini >= oFim + buffer;
    });
    if (livre) slots.push(toHHMM(ini));
  }
  return slots;
}
