// Mensagens prontas de acompanhamento do cliente (enviadas do painel com 1 toque).
// Tom da Caridad: pessoa real, calorosa e honesta — "sempre a mesma pessoa que
// cuida da sua casa". Nada de texto de robô. Tudo editável por ela aqui.
import { CONFIG } from "./config";

export type MsgCtx = {
  nome: string; // primeiro nome do cliente
  quando: string; // "16/07/2026 · 10:00" ou "a combinar"
  valor: string; // "R$ 150,00"
  servico: string; // "Limpeza Padrão"
};

export type ModeloMensagem = {
  id: string;
  titulo: string; // rótulo curto no menu do painel
  texto: (c: MsgCtx) => string;
};

const primeiroNome = (nome: string) => (nome || "").trim().split(/\s+/)[0] || "";

// Os momentos seguem o ciclo do serviço: confirmar -> lembrar -> a caminho ->
// concluir/cobrar -> agradecer -> reservar a próxima (fidelização).
export const MODELOS_MENSAGEM: ModeloMensagem[] = [
  {
    id: "confirmar",
    titulo: "Confirmar agendamento",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}, tudo bem? Aqui é a ${CONFIG.primeiroNome}. ` +
      `Já deixei sua limpeza marcada para ${c.quando} e vou cuidar de tudo com muito carinho. ` +
      `Se precisar mudar alguma coisa, é só me falar por aqui. 😊`,
  },
  {
    id: "lembrete",
    titulo: "Lembrete da véspera",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}, tudo bem? Passando só para lembrar da nossa limpeza ${c.quando}. ` +
      `Está tudo certo para você? Qualquer coisa a gente ajeita. 💚`,
  },
  {
    id: "caminho",
    titulo: "Estou a caminho",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}! Já estou a caminho, chego pertinho do horário. ` +
      `Vou deixar sua casa limpinha e cheirosa. Até já! 😊`,
  },
  {
    id: "concluido",
    titulo: "Concluí + cobrança Pix",
    texto: (c) =>
      `${primeiroNome(c.nome)}, terminei tudo por aqui! Deixei sua casa limpinha e cheirosa, ` +
      `espero de coração que você goste. O valor que combinamos foi ${c.valor} — quando puder, ` +
      `pode fazer o Pix na chave ${CONFIG.pix.chave} (em nome de ${CONFIG.pix.nome}). ` +
      `Muito obrigada pela confiança, viu? 💚`,
  },
  {
    id: "agradecer",
    titulo: "Agradecer",
    texto: (c) =>
      `${primeiroNome(c.nome)}, foi um prazer cuidar da sua casa hoje! ` +
      `Qualquer coisa que precisar, é só me chamar. Obrigada pela confiança de sempre. 💚`,
  },
  {
    id: "reagendar",
    titulo: "Reservar a próxima",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}, tudo bem? Já faz um tempinho da última limpeza e fiquei ` +
      `pensando em você. Quer que eu já reserve um horário? Me diz o melhor dia que eu separo. 😊`,
  },
];
