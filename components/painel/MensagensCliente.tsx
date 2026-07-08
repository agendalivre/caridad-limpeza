"use client";

import { useState } from "react";
import { linkWhatsApp } from "@/lib/whatsapp";
import { MODELOS_MENSAGEM, type MsgCtx } from "@/lib/mensagens";
import { IconWhatsApp } from "@/components/icons";

/**
 * Menu de mensagens prontas de acompanhamento. Cada opção abre o WhatsApp do
 * cliente já com o texto pronto (1 toque). Se não houver telefone, o WhatsApp
 * abre para Caridad escolher o contato.
 */
export function MensagensCliente({
  ctx,
  whatsapp,
  className = "",
}: {
  ctx: MsgCtx;
  whatsapp?: string | null;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto((v) => !v)} className={className}>
        <IconWhatsApp width={15} height={15} /> Mensagens
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-paper shadow-lg">
            <p className="border-b border-line px-3 py-2 text-xs font-semibold text-ink-mute">
              Enviar mensagem para {ctx.nome.split(" ")[0] || "o cliente"}
            </p>
            {MODELOS_MENSAGEM.map((m) => (
              <a
                key={m.id}
                href={linkWhatsApp(m.texto(ctx), whatsapp || "")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="flex items-center gap-2.5 border-b border-line px-3 py-2.5 text-left text-sm text-ink-soft transition-colors last:border-0 hover:bg-emerald-50 hover:text-ink"
              >
                <span className="text-base">{m.emoji}</span>
                <span>{m.titulo}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
