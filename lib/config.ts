// Configuración central del negocio de Caridad.
// ⚠️ Rellena WHATSAPP, PIX y VALOR_HORA con los datos reales antes de producción.

export const CONFIG = {
  nome: "Caridad Ceregido",
  primeiroNome: "Caridad",
  slogan: "Limpeza profissional de confiança em Curitiba",
  cidade: "Curitiba",
  site: "https://caridad-limpeza.vercel.app",

  // WhatsApp en formato internacional, solo dígitos (55 + DDD + número).
  whatsapp: "5541984226267", // Caridad · (41) 98422-6267

  pix: {
    chave: "09772499991", // CPF de Caridad
    nome: "CARIDAD CEREGIDO",
    cidade: "CURITIBA",
  },

  linkAvaliacao: "",
} as const;
