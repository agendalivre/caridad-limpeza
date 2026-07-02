"use client";

import { Reveal } from "./Reveal";
import { CONFIG } from "@/lib/config";
import { linkWhatsApp } from "@/lib/whatsapp";
import { IconWhatsApp, IconArrowRight } from "./icons";

export function CtaFinal() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-16 sm:px-16 sm:py-24">
            <div className="aurora animate-drift h-72 w-72 bg-emerald-700/50" style={{ top: "-4rem", right: "-3rem" }} />
            <div className="aurora animate-float h-64 w-64 bg-emerald-600/25" style={{ bottom: "-5rem", left: "-2rem" }} />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
                Vamos combinar?
              </p>
              <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] text-ivory sm:text-5xl">
                Sua casa merece esse{" "}
                <span className="italic text-emerald-100">cuidado.</span>
              </h2>
              <p className="mt-5 max-w-lg text-lg text-ivory/70">
                Me chame no WhatsApp. Respondo rapidinho e combinamos tudo com
                todo o carinho — do jeitinho que você gosta.
              </p>
              <div className="mt-10 flex flex-col gap-3.5 sm:flex-row">
                <a href="/reservar" className="btn-emerald btn-lg">
                  Calcular meu orçamento
                  <IconArrowRight width={18} height={18} />
                </a>
                <a
                  href={linkWhatsApp(`Olá ${CONFIG.primeiroNome}! Quero agendar uma limpeza. 🧼✨`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-lg border border-ivory/25 text-ivory hover:bg-ivory hover:text-ink"
                >
                  <IconWhatsApp width={20} height={20} />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
