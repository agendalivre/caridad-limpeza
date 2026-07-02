import { CONFIG } from "@/lib/config";
import { linkWhatsApp } from "@/lib/whatsapp";
import { IconWhatsApp } from "./icons";
import { InstallButton } from "./InstallButton";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-col items-center justify-between gap-5 py-10 sm:flex-row">
        <span className="font-serif text-lg font-semibold text-ink">
          Caridad <span className="text-emerald-600">Ceregido</span>
        </span>
        <p className="text-sm text-ink-mute">
          Limpeza profissional · {CONFIG.cidade} · Atendimento com hora marcada
        </p>
        <a
          href={linkWhatsApp(`Olá ${CONFIG.primeiroNome}!`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <IconWhatsApp width={16} height={16} />
          WhatsApp
        </a>
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-line py-4 text-center text-xs text-ink-mute">
        <span>© {new Date().getFullYear()} {CONFIG.nome}. Feito com cuidado.</span>
        <span className="text-line">·</span>
        <a href="/painel/login" className="hover:text-ink">Área da Caridad</a>
        <InstallButton className="hover:text-ink" label="· Instalar como app" />
      </div>
    </footer>
  );
}
