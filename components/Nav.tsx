"use client";

import { useEffect, useState } from "react";
import { IconArrowRight } from "./icons";

const LINKS = [
  { href: "#confianca", label: "Por que eu" },
  { href: "#servicos", label: "Serviços" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-300 ${
          scrolled ? "border-b border-line bg-ivory/85 backdrop-blur-md" : "border-b border-transparent"
        }`}
      >
        <nav className="container-x flex items-center justify-between py-4">
          <a href="#top" className="font-serif text-xl font-semibold tracking-tight text-ink">
            Caridad <span className="text-emerald-600">Ceregido</span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ))}
          </div>

          <a href="/reservar" className="btn-emerald px-5 py-2.5 text-sm">
            Fazer orçamento
            <IconArrowRight width={16} height={16} />
          </a>
        </nav>
      </div>
    </header>
  );
}
