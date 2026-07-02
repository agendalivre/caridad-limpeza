"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CONFIG } from "@/lib/config";
import { linkWhatsApp } from "@/lib/whatsapp";
import { IconWhatsApp, IconStar, IconArrowRight } from "./icons";

const LINHA1 = ["Sempre", "a", "mesma", "pessoa"];
const LINHA2 = ["de", "confiança", "na", "sua", "casa."];

export function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.055, delayChildren: 0.15 } },
  };
  const word = {
    hidden: { opacity: 0, y: reduce ? 0 : "0.5em" },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };
  const fade = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-44">
      {/* Fundo: foto de Caridad + véus para legibilidade */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/caridad.webp"
          alt="Caridad Ceregido, profissional de limpeza em Curitiba"
          fetchPriority="high"
          className="absolute right-0 top-0 h-full w-full object-cover object-[center_16%] sm:w-[54%] sm:object-[center_14%]"
          style={{ filter: "saturate(1.06) contrast(1.02)" }}
        />
        {/* Móvel: véu leve em degradê (rosto visível em cima, texto legível embaixo) */}
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/30 via-ivory/45 to-ivory/75 sm:hidden" />
        {/* Desktop: gradiente lateral suave (texto à esquerda, foto à direita) */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-ivory from-15% via-ivory/60 to-transparent sm:block" />
        {/* Blends topo/base */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ivory to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ivory to-transparent" />
        {/* Brilho esmeralda sutil */}
        <div className="aurora animate-drift h-72 w-72 bg-emerald-100/50" style={{ top: "-3rem", left: "-4rem" }} />
      </div>

      <div className="container-x relative">
        <div className="sm:max-w-[58%] lg:max-w-[56%]">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="eyebrow mb-6"
          >
            Limpeza profissional · {CONFIG.cidade}
          </motion.p>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="font-serif text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl md:text-7xl"
          >
            <span className="block">
              {LINHA1.map((w, i) => (
                <Fragment key={i}>
                  <motion.span variants={word} className="inline-block">
                    {w}
                  </motion.span>{" "}
                </Fragment>
              ))}
            </span>
            <span className="block">
              {LINHA2.map((w, i) => (
                <Fragment key={i}>
                  <motion.span
                    variants={word}
                    className={`inline-block ${w === "confiança" ? "italic text-emerald-600" : ""}`}
                  >
                    {w}
                  </motion.span>{" "}
                </Fragment>
              ))}
            </span>
          </motion.h1>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft"
          >
            Sou a Caridad. Cuido de lares em Curitiba com capricho, carinho e
            discrição — direto com você, sem aplicativos no meio.
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="mt-10 flex flex-col gap-3.5 sm:flex-row"
          >
            <a href="/reservar" className="btn-emerald btn-lg">
              Ver meu preço em 1 minuto
              <IconArrowRight width={18} height={18} />
            </a>
            <a
              href={linkWhatsApp(`Olá ${CONFIG.primeiroNome}! Vi seu site e gostaria de agendar uma limpeza. 😊`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost btn-lg"
            >
              <IconWhatsApp width={20} height={20} />
              Tirar dúvida no WhatsApp
            </a>
          </motion.div>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.16 }}
            className="mt-4 text-sm text-ink-mute"
          >
            Leva 1 minutinho — e sua reserva já chega com todos os detalhes.
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ink-soft"
          >
            <span className="flex items-center gap-1.5">
              <span className="flex text-gold">
                {[0, 1, 2, 3, 4].map((i) => (
                  <IconStar key={i} width={16} height={16} />
                ))}
              </span>
              <b className="font-semibold text-ink">5,0</b>
            </span>
            <span className="h-4 w-px bg-line" />
            <span><b className="font-semibold text-ink">+200</b> lares atendidos</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
