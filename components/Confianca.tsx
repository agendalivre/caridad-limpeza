"use client";

import { Reveal } from "./Reveal";
import { IconShield, IconWallet, IconHeart } from "./icons";
import type { ReactNode } from "react";

const HOOKS: { icon: ReactNode; titulo: string; texto: string }[] = [
  {
    icon: <IconShield width={24} height={24} />,
    titulo: "Você nunca abre a porta pra um estranho",
    texto:
      "A mesma profissional em todas as visitas. Nada de rostos diferentes a cada semana — só confiança que se constrói.",
  },
  {
    icon: <IconWallet width={24} height={24} />,
    titulo: "Sem app no meio. Sem comissão no seu bolso.",
    texto:
      "Combinamos tudo pelo WhatsApp, sem a comissão de um aplicativo encarecendo o seu serviço.",
  },
  {
    icon: <IconHeart width={24} height={24} />,
    titulo: "Cuidado em cada detalhe",
    texto:
      "Uma reputação construída lar por lar, com nota 5,0 de quem já me conhece.",
  },
];

export function Confianca() {
  return (
    <section id="confianca" className="relative py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-4">Por que a Caridad</p>
          <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-[2.6rem]">
            As famílias de Curitiba confiam — e recomendam.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {HOOKS.map((h, i) => (
            <Reveal key={h.titulo} delay={i * 0.1} className="h-full">
              <div className="flex h-full flex-col bg-paper p-8">
                <span className="mb-6 text-emerald-600">{h.icon}</span>
                <h3 className="font-serif text-xl font-semibold text-ink">{h.titulo}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{h.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
