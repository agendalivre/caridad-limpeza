import { CONFIG } from "./config";

/** Link wa.me con mensaje pre-rellenado. Gratis, sin API. */
export function linkWhatsApp(mensagem: string, telefone: string = CONFIG.whatsapp) {
  const numero = telefone.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

/** Mensaje completo de reserva que el CLIENTE envía desde /reservar. */
export function mensagemReserva(d: {
  nome: string;
  imovel: string;
  quartos: number;
  banheiros: number;
  servico: string;
  adicionais: string[];
  horas: number;
  cep?: string;
  endereco?: string;
  data?: string;
  hora?: string;
  frequencia: string;
  total: number;
}) {
  return [
    `Olá ${CONFIG.primeiroNome}! 👋 Quero agendar uma limpeza:`,
    ``,
    `👤 ${d.nome}`,
    `🏠 ${d.imovel} · ${d.quartos} quarto(s) · ${d.banheiros} banheiro(s)`,
    `🧼 ${d.servico}`,
    d.adicionais.length ? `➕ Adicionais: ${d.adicionais.join(", ")}` : ``,
    `⏱️ Duração estimada: ${d.horas}h`,
    d.endereco ? `📍 ${d.endereco}${d.cep ? ` (CEP ${d.cep})` : ""}` : ``,
    d.data ? `📅 ${d.data}${d.hora ? ` às ${d.hora}` : ""}` : ``,
    `🔁 Frequência: ${d.frequencia}`,
    ``,
    `💰 Valor estimado: ${fmt(d.total)}`,
    `Podemos confirmar? 😊`,
  ]
    .filter(Boolean)
    .join("\n");
}
