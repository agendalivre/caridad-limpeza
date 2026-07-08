// Mensagens prontas de acompanhamento do cliente (enviadas do painel com 1 toque).
// Tom caloroso, "sempre a mesma pessoa". Tudo editável por Caridad aqui.
import { CONFIG } from "./config";

export type MsgCtx = {
  nome: string; // primeiro nome do cliente
  quando: string; // "16/07/2026 · 10:00" ou "a combinar"
  valor: string; // "R$ 150,00"
  servico: string; // "Limpeza Padrão"
};

export type ModeloMensagem = {
  id: string;
  titulo: string; // rótulo curto no menu
  emoji: string;
  texto: (c: MsgCtx) => string;
};

const primeiroNome = (nome: string) => (nome || "").trim().split(/\s+/)[0] || "";

// Os momentos seguem o ciclo do serviço: confirmar → lembrar → a caminho →
// concluir/cobrar → agradecer → reservar a próxima (fidelização).
export const MODELOS_MENSAGEM: ModeloMensagem[] = [
  {
    id: "confirmar",
    titulo: "Confirmar agendamento",
    emoji: "✅",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}! 😊 Aqui é a ${CONFIG.primeiroNome}. Confirmei sua ${c.servico.toLowerCase()} para ${c.quando}. Qualquer coisa, é só me chamar por aqui!`,
  },
  {
    id: "lembrete",
    titulo: "Lembrete da véspera",
    emoji: "🔔",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}! 💚 Passando para lembrar da sua limpeza em ${c.quando}. Está tudo certo para o horário combinado?`,
  },
  {
    id: "caminho",
    titulo: "Estou a caminho",
    emoji: "🚗",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}! Já estou a caminho 🚗 Chego em breve para deixar tudo impecável para você ✨`,
  },
  {
    id: "concluido",
    titulo: "Concluí + cobrança Pix",
    emoji: "✨",
    texto: (c) =>
      `${primeiroNome(c.nome)}, terminei sua limpeza! ✨ Deixei tudo limpinho e cheiroso. O valor combinado foi ${c.valor} — quando puder, você pode enviar pelo Pix (chave ${CONFIG.pix.chave} · ${CONFIG.pix.nome}). Muito obrigada pela confiança! 💚`,
  },
  {
    id: "agradecer",
    titulo: "Agradecer" + (CONFIG.linkAvaliacao ? " + avaliação" : ""),
    emoji: "🙏",
    texto: (c) =>
      `Foi um prazer cuidar da sua casa, ${primeiroNome(c.nome)}! 😊${
        CONFIG.linkAvaliacao
          ? ` Se puder deixar uma avaliação, me ajuda muito: ${CONFIG.linkAvaliacao}`
          : " Se precisar de qualquer coisa, é só me chamar."
      } Obrigada! 💚`,
  },
  {
    id: "reagendar",
    titulo: "Reservar a próxima",
    emoji: "📅",
    texto: (c) =>
      `Oi ${primeiroNome(c.nome)}! 💚 Já faz um tempinho da última limpeza. Quer que eu reserve um horário para você? É só me dizer o melhor dia. 😊`,
  },
];
