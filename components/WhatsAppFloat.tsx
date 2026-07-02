"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CONFIG } from "@/lib/config";
import { linkWhatsApp } from "@/lib/whatsapp";
import { IconWhatsApp } from "./icons";

export function WhatsAppFloat() {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href={linkWhatsApp(`Olá ${CONFIG.nome}! Gostaria de agendar uma limpeza. 😊`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" />
      <IconWhatsApp width={28} height={28} />
    </motion.a>
  );
}
