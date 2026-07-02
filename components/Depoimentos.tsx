"use client";

import { Reveal } from "./Reveal";
import { IconStar } from "./icons";

const DEPOIMENTOS = [
  { nome: "Ana Paula M.", bairro: "Batel", texto: "Minha casa nunca esteve tão limpa. Caprichosa e super confiável — deixo as chaves sem preocupação." },
  { nome: "Roberto S.", bairro: "Água Verde", texto: "Contratei a faxina pesada e minha casa ficou impecável, detalhe por detalhe. Recomendo de olhos fechados." },
  { nome: "Juliana T.", bairro: "Cabral", texto: "Melhor decisão sair dos aplicativos e chamar direto a Caridad. Preço justo e sempre pontual." },
];

export function Depoimentos() {
  return (
    <section className="relative py-12">
      <div className="container-x">
        <div className="grid gap-5 md:grid-cols-3">
          {DEPOIMENTOS.map((d, i) => (
            <Reveal key={d.nome} delay={i * 0.08}>
              <figure className="flex h-full flex-col border-l-2 border-emerald-600/30 pl-5">
                <span className="mb-3 flex gap-0.5 text-gold">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <IconStar key={s} width={15} height={15} />
                  ))}
                </span>
                <blockquote className="flex-1 font-serif text-lg italic leading-relaxed text-ink">
                  “{d.texto}”
                </blockquote>
                <figcaption className="mt-4 text-sm text-ink-mute">
                  <b className="font-semibold text-ink">{d.nome}</b> · {d.bairro}, Curitiba
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
