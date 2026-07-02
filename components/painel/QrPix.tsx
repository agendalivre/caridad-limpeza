"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CONFIG } from "@/lib/config";
import { gerarPixCopiaECola } from "@/lib/pix";
import { IconX, IconCheck } from "@/components/icons";

export function QrPix({
  valor,
  descricao,
  onClose,
}: {
  valor: number;
  descricao?: string;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  const payload = gerarPixCopiaECola({
    chave: CONFIG.pix.chave,
    nome: CONFIG.pix.nome,
    cidade: CONFIG.pix.cidade,
    valor: valor > 0 ? valor : undefined,
    descricao,
  });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const semChave = !CONFIG.pix.chave;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-ink">Cobrar com Pix</h3>
          <button onClick={onClose} aria-label="Fechar" className="cursor-pointer text-ink-mute hover:text-ink">
            <IconX width={20} height={20} />
          </button>
        </div>

        {semChave ? (
          <p className="py-8 text-sm text-ink-mute">
            Configure a chave Pix em <code>lib/config.ts</code> para gerar o QR.
          </p>
        ) : (
          <>
            <p className="mb-1 text-sm text-ink-soft">Valor</p>
            <p className="mb-4 font-serif text-3xl font-semibold text-ink">
              R$ {valor.toFixed(2).replace(".", ",")}
            </p>
            <div className="mx-auto w-fit rounded-2xl border border-line bg-white p-3">
              <QRCodeSVG value={payload} size={188} level="M" />
            </div>
            <p className="mt-4 break-all rounded-xl bg-ivory px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
              {payload}
            </p>
            <button onClick={copiar} className={`btn-emerald btn-lg mt-4 w-full ${copiado ? "!bg-emerald-700" : ""}`}>
              {copiado ? <IconCheck width={18} height={18} /> : null}
              {copiado ? "Copiado!" : "Copiar Pix Copia e Cola"}
            </button>
            <p className="mt-3 text-xs text-ink-mute">
              A cliente paga na hora. Depois toque em “Marcar pago”.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
