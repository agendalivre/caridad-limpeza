"use client";

import { useRef } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { CONFIG } from "@/lib/config";
import { Guard } from "@/components/painel/Guard";
import { InstallButton } from "@/components/InstallButton";

function Qr() {
  const wrap = useRef<HTMLDivElement>(null);

  function baixar() {
    const canvas = wrap.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-caridad.png";
    a.click();
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="container-x flex items-center justify-between py-4">
          <span className="font-serif text-lg font-semibold text-ink">
            Meu QR · <span className="text-emerald-600">Caridad</span>
          </span>
          <Link href="/painel" className="text-sm font-medium text-ink-soft hover:text-ink">← Agenda</Link>
        </div>
      </header>

      <div className="container-x grid place-items-center pt-10">
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="font-serif text-2xl font-semibold text-ink">Mostre para o cliente</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Ele aponta a câmera, abre seu site e agenda na hora.
          </p>

          <div ref={wrap} className="mx-auto mt-6 w-fit rounded-2xl border border-line bg-white p-4">
            <QRCodeCanvas
              value={CONFIG.site}
              size={230}
              level="H"
              marginSize={2}
              imageSettings={{ src: "/icon-192.png", height: 46, width: 46, excavate: true }}
            />
          </div>

          <p className="mt-4 text-xs text-ink-mute">{CONFIG.site.replace("https://", "")}</p>

          <button onClick={baixar} className="btn-ink btn-lg mt-6 w-full">
            Baixar QR (imagem)
          </button>

          <div className="mt-6 rounded-xl bg-ivory p-4 text-left text-sm text-ink-soft">
            <p className="font-semibold text-ink">Instale sua agenda no celular</p>
            <p className="mt-1">
              Deixe o atalho do seu painel na tela inicial, como um app próprio.
              Assim você abre sua agenda com um toque.
            </p>
            <InstallButton className="btn-ink btn-lg mt-3 w-full" label="Instalar meu painel" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QrPage() {
  return (
    <Guard>
      <Qr />
    </Guard>
  );
}
