"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { assinarPush, assinaturaAtual, pushSuportado } from "@/lib/push";

type Estado = "carregando" | "inativo" | "ativo" | "negado" | "nao_suportado";

/** Banner do painel: ativa avisos de novas reservas no celular de Caridad. */
export function Notificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSuportado()) {
      setEstado("nao_suportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("negado");
      return;
    }
    assinaturaAtual()
      .then((s) => setEstado(s ? "ativo" : "inativo"))
      .catch(() => setEstado("inativo"));
  }, []);

  async function ativar() {
    setBusy(true);
    try {
      const sub = await assinarPush();
      if (!sub) {
        setEstado(Notification.permission === "denied" ? "negado" : "inativo");
        return;
      }
      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          endpoint: sub.endpoint,
          subscription: json,
          user_agent: navigator.userAgent.slice(0, 200),
        },
        { onConflict: "endpoint" }
      );
      setEstado("ativo");
    } finally {
      setBusy(false);
    }
  }

  if (estado === "carregando" || estado === "ativo") return null;

  if (estado === "nao_suportado" || estado === "negado") {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        {estado === "negado"
          ? "Avisos bloqueados — libere as notificações nas configurações do navegador."
          : "Para receber avisos de reservas no iPhone, instale o app na tela inicial (Compartilhar → Adicionar à Tela de Início)."}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
      <p className="text-sm text-ink-soft">
        <b className="font-semibold text-ink">🔔 Receba um aviso</b> no celular quando chegar uma
        reserva nova.
      </p>
      <button onClick={ativar} disabled={busy} className="btn-emerald px-4 py-2 text-xs disabled:opacity-60">
        {busy ? "Ativando…" : "Ativar avisos"}
      </button>
    </div>
  );
}
