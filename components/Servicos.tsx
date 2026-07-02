"use client";

import { Reveal } from "./Reveal";
import {
  IconSparkle,
  IconBroom,
  IconBuilding,
  IconIron,
  IconArrowRight,
  IconCheck,
} from "./icons";
import type { ReactNode } from "react";

const SERVICOS: { icon: ReactNode; nome: string; desc: string; inclui: string; horas: string }[] = [
  { icon: <IconSparkle width={24} height={24} />, nome: "Limpeza Padrão", desc: "Manutenção do dia a dia da sua casa.", inclui: "Cozinha, sala, quartos, banheiros e áreas comuns.", horas: "a partir de 4h" },
  { icon: <IconBroom width={24} height={24} />, nome: "Limpeza Pesada", desc: "A faxina completa, detalhe por detalhe.", inclui: "Tudo da padrão, com limpeza mais profunda.", horas: "a partir de 7h" },
  { icon: <IconBuilding width={24} height={24} />, nome: "Comercial", desc: "Escritórios, lojas e salas impecáveis.", inclui: "Recepção, salas, copa e sanitários.", horas: "a partir de 3h" },
  { icon: <IconIron width={24} height={24} />, nome: "Passadoria", desc: "Suas roupas passadas com capricho.", inclui: "Passar e dobrar as suas roupas.", horas: "a partir de 2h" },
];

export function Servicos() {
  return (
    <section id="servicos" className="relative py-20 sm:py-28">
      <div className="container-x">
        <Reveal className="flex flex-col items-end justify-between gap-6 sm:flex-row">
          <div className="max-w-xl">
            <p className="eyebrow mb-4">Serviços</p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-[2.6rem]">
              Um cuidado para cada momento
            </h2>
          </div>
          <a href="/reservar" className="btn-emerald btn-lg shrink-0">
            Ver meu preço em 1 minuto
            <IconArrowRight width={18} height={18} />
          </a>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICOS.map((s, i) => (
            <Reveal key={s.nome} delay={(i % 3) * 0.08}>
              <a
                href="/reservar"
                className="group card flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-600/40"
              >
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  {s.icon}
                </span>
                <h3 className="font-serif text-xl font-semibold text-ink">{s.nome}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{s.desc}</p>
                <p className="mt-4 flex flex-1 items-start gap-1.5 text-xs text-ink-mute">
                  <IconCheck width={13} height={13} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span><b className="font-medium text-ink-soft">Inclui:</b> {s.inclui}</span>
                </p>
                <span className="mt-4 text-sm font-semibold uppercase tracking-wide text-emerald-600">
                  {s.horas}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
