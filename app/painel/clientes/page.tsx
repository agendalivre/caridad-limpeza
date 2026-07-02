"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Guard } from "@/components/painel/Guard";
import { IconWhatsApp, IconMapPin, IconX } from "@/components/icons";

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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmar, setConfirmar] = useState<Cliente | null>(null);
  const [busy, setBusy] = useState(false);
  const [aviso, setAviso] = useState("");

  const load = useCallback(async () => {
    const [cli, ag] = await Promise.all([
      supabase.from("clientes").select("*").order("criado_em", { ascending: false }),
      supabase.from("agendamentos").select("cliente_id"),
    ]);
    setItems((cli.data as Cliente[]) ?? []);
    const c: Record<string, number> = {};
    for (const row of (ag.data ?? []) as { cliente_id: string }[]) {
      c[row.cliente_id] = (c[row.cliente_id] ?? 0) + 1;
    }
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function borrar() {
    if (!confirmar) return;
    setBusy(true);
    const { error } = await supabase.from("clientes").delete().eq("id", confirmar.id);
    setBusy(false);
    if (error) {
      setAviso("Não foi possível excluir. Tente de novo.");
      setTimeout(() => setAviso(""), 3000);
      return;
    }
    setConfirmar(null);
    setAviso("Cliente excluído ✔");
    setTimeout(() => setAviso(""), 2500);
    await load();
  }

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
          <div className="flex items-center gap-4 text-sm">
            <Link href="/painel/calendario" className="font-medium text-ink-soft hover:text-ink">Calendário</Link>
            <Link href="/painel" className="font-medium text-ink-soft hover:text-ink">← Agenda</Link>
          </div>
        </div>
      </header>

      {aviso && (
        <div className="container-x pt-4">
          <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{aviso}</p>
        </div>
      )}

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
                <div className="min-w-0">
                  <p className="font-serif text-lg font-semibold text-ink">{c.nome}</p>
                  {(c.endereco || c.bairro) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mute">
                      <IconMapPin width={14} height={14} />
                      {[c.endereco, c.bairro].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {counts[c.id] > 0 && (
                    <p className="mt-1 text-xs text-ink-mute">{counts[c.id]} reserva(s)</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={linkWhatsApp(`Olá ${c.nome}!`, c.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-white"
                    aria-label={`WhatsApp de ${c.nome}`}
                  >
                    <IconWhatsApp width={20} height={20} />
                  </a>
                  <button
                    onClick={() => setConfirmar(c)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-mute transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Excluir ${c.nome}`}
                  >
                    <IconX width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmação de exclusão */}
      {confirmar && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-5" onClick={() => !busy && setConfirmar(null)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-lg font-semibold text-ink">Excluir {confirmar.nome}?</p>
            <p className="mt-2 text-sm text-ink-soft">
              {counts[confirmar.id] > 0
                ? `Isso também apaga ${counts[confirmar.id]} reserva(s) e o histórico de pagamento desse cliente. Não dá para desfazer.`
                : "Essa ação não pode ser desfeita."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmar(null)} disabled={busy} className="btn-ghost px-4 py-2 text-sm disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={borrar}
                disabled={busy}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
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
