// Motor de orçamento POR HORAS (modelo tipo Parafuzo).
// quartos + banheiros + tipo de limpeza -> horas estimadas -> preço.
// Os adicionais somam horas. Tudo editável por Caridad.

// R$/hora. Abaixo do mercado (autônoma R$25–40/h) e do Parafuzo (~R$38/h no cliente):
// o cliente PAGA MENOS que no app e Caridad ainda fica com 100% (+~45% vs o app).
export const VALOR_HORA = 30;

export type TipoImovel = "casa" | "apartamento" | "studio";

export const IMOVEIS: { id: TipoImovel; nome: string }[] = [
  { id: "casa", nome: "Casa" },
  { id: "apartamento", nome: "Apartamento" },
  { id: "studio", nome: "Studio" },
];

// Tempo-base por tipo de imóvel (casa > apto > studio). Calibrado com o Parafuzo:
// casa 3q/1b ≈ 5h, apto 3q/1b ≈ 4,5h, studio 1q/1b ≈ 3h.
const BASE_IMOVEL: Record<TipoImovel, number> = {
  casa: 2.5,
  apartamento: 2.0,
  studio: 1.75,
};

export type TipoLimpeza = "padrao" | "pesada" | "comercial" | "passadoria";

export const LIMPEZAS: {
  id: TipoLimpeza;
  nome: string;
  desc: string;
  mult: number; // multiplicador sobre (base + cômodos)
  extra: number; // horas fixas do serviço pesado (trabalho profundo, quase independe de cômodos)
  minHoras: number;
}[] = [
  { id: "padrao", nome: "Limpeza Padrão", desc: "Manutenção do dia a dia", mult: 1.0, extra: 0, minHoras: 3 },
  { id: "pesada", nome: "Limpeza Pesada", desc: "A faxina completa e detalhada", mult: 1.0, extra: 4.5, minHoras: 7 },
  { id: "comercial", nome: "Comercial", desc: "Escritórios, lojas e salas", mult: 1.0, extra: 0, minHoras: 3 },
  { id: "passadoria", nome: "Passadoria de roupas", desc: "Suas roupas passadas com capricho", mult: 1.0, extra: 0, minHoras: 2 },
];

// horas = tempo real que soma na agenda de Caridad (calibrado com o Parafuzo).
// preco = valor fixo modesto do extra (o app cobra hora extra barata ~R$16/h,
// então cobrar o adicional por hora cheia encareceria demais).
export const ADICIONAIS: { id: string; nome: string; horas: number; preco: number }[] = [
  { id: "area_servico", nome: "Área de serviço / lavanderia", horas: 0.5, preco: 15 },
  { id: "geladeira", nome: "Interior de geladeira", horas: 0.5, preco: 15 },
  { id: "janelas", nome: "Interior de janelas", horas: 1, preco: 30 },
  { id: "armarios", nome: "Interior de armários de cozinha", horas: 1.5, preco: 30 },
  { id: "tapete", nome: "Aspirar tapete ou estofado", horas: 1, preco: 20 },
  { id: "externa", nome: "Área externa (até 20m²)", horas: 2, preco: 45 },
  { id: "passadoria2h", nome: "Passadoria de roupas (+2h)", horas: 2, preco: 50 },
  { id: "lavar", nome: "Lavar roupas", horas: 1, preco: 20 },
];

export type Frequencia = "pontual" | "mensal" | "quinzenal" | "semanal";

export const FREQUENCIAS: { id: Frequencia; label: string; nota?: string }[] = [
  { id: "pontual", label: "Pontual" },
  { id: "mensal", label: "Mensal", nota: "-5%" },
  { id: "quinzenal", label: "Quinzenal", nota: "-10%" },
  { id: "semanal", label: "Semanal", nota: "-15%" },
];

const DESCONTO: Record<Frequencia, number> = {
  pontual: 0,
  mensal: 0.05,
  quinzenal: 0.1,
  semanal: 0.15,
};

const round05 = (n: number) => Math.round(n * 2) / 2;

export function estimar(params: {
  imovel: TipoImovel;
  tipoLimpeza: TipoLimpeza;
  quartos: number;
  banheiros: number;
  adicionais: string[];
  freq: Frequencia;
}) {
  const { imovel, tipoLimpeza, quartos, banheiros, adicionais, freq } = params;
  const l = LIMPEZAS.find((x) => x.id === tipoLimpeza) ?? LIMPEZAS[0];

  // Tempo realista para UMA profissional (não uma equipe).
  // Base por tipo de imóvel + tempo por quarto/banheiro, vezes o multiplicador do tipo.
  const POR_QUARTO = 0.75;
  const POR_BANHEIRO = 0.75;
  const base = BASE_IMOVEL[imovel] ?? 2.5;
  let horasBase =
    l.id === "passadoria"
      ? l.minHoras
      : (base + quartos * POR_QUARTO + banheiros * POR_BANHEIRO) * l.mult + l.extra;
  horasBase = Math.max(l.minHoras, round05(horasBase));

  const horasAdd = adicionais.reduce(
    (s, id) => s + (ADICIONAIS.find((a) => a.id === id)?.horas ?? 0),
    0
  );
  const precoAdd = adicionais.reduce(
    (s, id) => s + (ADICIONAIS.find((a) => a.id === id)?.preco ?? 0),
    0
  );

  const horas = horasBase + horasAdd;
  // Base cobrada por hora; adicionais com preço fixo modesto (como o app),
  // para acrescentar extras sem disparar o valor.
  const bruto = horasBase * VALOR_HORA + precoAdd;
  const desconto = bruto * DESCONTO[freq];

  return {
    servico: l.nome,
    horas,
    bruto,
    desconto,
    total: Math.round((bruto - desconto) * 100) / 100,
  };
}
