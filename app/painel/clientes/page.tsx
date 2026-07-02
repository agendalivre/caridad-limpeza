"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Guard } from "@/components/painel/Guard";
import { IconWhatsApp, IconMapPin } from "@/components/icons";

type Cliente = {
  id: string;
  nome: string;
  whatsapp: string;
  bairro: string | null;
  endereco: string | null;
  criado_em: string;
};

function Clientes() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .order("criado_em", { ascending: false })
      .then(({ data }) => {
        setItems((data as Cliente[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtrados = items.filter(
    (c) =>
      c.nome.toLowerCase().includes(q.toLowerCase()) ||
      (c.bairro ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="container-x flex items-center justify-between py-4">
          <span className="font-serif text-lg font-semibold text-ink">
            Clientes · <span className="text-emerald-600">Caridad</span>
          </span>
          <Link href="/painel" className="text-sm font-medium text-ink-soft hover:text-ink">← Agenda</Link>
        </div>
      </header>

      <div className="container-x pt-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou bairro…"
          className="mb-6 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-emerald-600"
        />

        {loading ? (
          <p className="text-ink-mute">Carregando…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-ink-mute">Nenhum cliente ainda. Eles aparecem aqui quando reservam pelo site.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtrados.map((c) => (
              <div key={c.id} className="card flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="font-serif text-lg font-semibold text-ink">{c.nome}</p>
                  {(c.endereco || c.bairro) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mute">
                      <IconMapPin width={14} height={14} />
                      {[c.endereco, c.bairro].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <a
                  href={linkWhatsApp(`Olá ${c.nome}!`, c.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"
                  aria-label={`WhatsApp de ${c.nome}`}
                >
                  <IconWhatsApp width={20} height={20} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ClientesPage() {
  return (
    <Guard>
      <Clientes />
    </Guard>
  );
}
