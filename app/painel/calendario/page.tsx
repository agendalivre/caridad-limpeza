"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Guard } from "@/components/painel/Guard";
import { LIMPEZAS } from "@/lib/precos";
import { IconPlus, IconX, IconCheck } from "@/components/icons";

type Cliente = { id: string; nome: string; whatsapp: string; bairro: string | null; endereco: string | null };
type Agendamento = {
  id: string;
  cliente_id: string;
  data: string | null;
  hora_inicio: string | null;
  valor: number;
  horas: number | null;
  quartos: number | null;
  banheiros: number | null;
  status: "solicitado" | "confirmado" | "concluido" | "cancelado";
  servico_nome: string | null;
  recorrencia: string | null;
  origem: string;
  observacoes: string | null;
  endereco: string | null;
  clientes: { nome: string } | null;
};

const STATUS_CLS: Record<string, string> = {
  solicitado: "bg-amber-400",
  confirmado: "bg-emerald-500",
  concluido: "bg-ink/40",
  cancelado: "bg-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const iso = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD local
const fmtR$ = (n: number) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

type FormState = {
  id: string | null;
  cliente_id: string;
  novoNome: string;
  novoWhatsapp: string;
  data: string;
  hora: string;
  servico_nome: string;
  horas: string;
  quartos: string;
  banheiros: string;
  valor: string;
  status: Agendamento["status"];
  recorrencia: string;
  endereco: string;
  observacoes: string;
};

const formVazio = (data: string): FormState => ({
  id: null,
  cliente_id: "",
  novoNome: "",
  novoWhatsapp: "",
  data,
  hora: "",
  servico_nome: LIMPEZAS[0].nome,
  horas: "",
  quartos: "",
  banheiros: "",
  valor: "",
  status: "confirmado",
  recorrencia: "pontual",
  endereco: "",
  observacoes: "",
});

function Calendario() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth()); // 0-11
  const [items, setItems] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [aviso, setAviso] = useState("");
  const [confirmarDel, setConfirmarDel] = useState<Agendamento | null>(null);

  const load = useCallback(async () => {
    const [ag, cli] = await Promise.all([
      supabase
        .from("agendamentos")
        .select("*, clientes(nome)")
        .order("hora_inicio", { ascending: true }),
      supabase.from("clientes").select("id, nome, whatsapp, bairro, endereco").order("nome"),
    ]);
    setItems((ag.data as Agendamento[]) ?? []);
    setClientes((cli.data as Cliente[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (m: string) => {
    setAviso(m);
    setTimeout(() => setAviso(""), 2500);
  };

  // Grid do mês (começa no domingo)
  const semanas = useMemo(() => {
    const primeiro = new Date(ano, mes, 1);
    const inicio = new Date(primeiro);
    inicio.setDate(1 - primeiro.getDay()); // volta ao domingo
    const dias: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      dias.push(d);
    }
    const out: Date[][] = [];
    for (let i = 0; i < 42; i += 7) out.push(dias.slice(i, i + 7));
    return out;
  }, [ano, mes]);

  const porDia = useMemo(() => {
    const m: Record<string, Agendamento[]> = {};
    for (const a of items) {
      if (!a.data || a.status === "cancelado") continue;
      (m[a.data] ??= []).push(a);
    }
    return m;
  }, [items]);

  const doDia = diaSel ? (porDia[diaSel] ?? []).slice().sort((a, b) => (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? "")) : [];

  function mudarMes(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMes(m);
    setAno(a);
    setDiaSel(null);
  }

  function abrirNovo(data: string) {
    setForm(formVazio(data));
  }

  function abrirEditar(a: Agendamento) {
    setForm({
      id: a.id,
      cliente_id: a.cliente_id,
      novoNome: "",
      novoWhatsapp: "",
      data: a.data ?? diaSel ?? iso(hoje),
      hora: a.hora_inicio ? a.hora_inicio.slice(0, 5) : "",
      servico_nome: a.servico_nome ?? LIMPEZAS[0].nome,
      horas: a.horas != null ? String(a.horas) : "",
      quartos: a.quartos != null ? String(a.quartos) : "",
      banheiros: a.banheiros != null ? String(a.banheiros) : "",
      valor: String(a.valor),
      status: a.status,
      recorrencia: a.recorrencia ?? "pontual",
      endereco: a.endereco ?? "",
      observacoes: a.observacoes ?? "",
    });
  }

  async function salvar() {
    if (!form) return;
    const criandoCliente = !form.cliente_id && form.novoNome.trim();
    if (!form.cliente_id && !criandoCliente) {
      flash("Escolha um cliente ou preencha o nome.");
      return;
    }
    if (!form.valor || isNaN(Number(form.valor))) {
      flash("Informe o valor.");
      return;
    }
    setBusy(true);

    let clienteId = form.cliente_id;
    if (criandoCliente) {
      const { data, error } = await supabase
        .from("clientes")
        .insert({ nome: form.novoNome.trim(), whatsapp: form.novoWhatsapp.replace(/\D/g, "") || "—" })
        .select("id")
        .single();
      if (error || !data) {
        setBusy(false);
        flash("Não foi possível criar o cliente.");
        return;
      }
      clienteId = data.id;
    }

    const patch = {
      cliente_id: clienteId,
      data: form.data || null,
      hora_inicio: form.hora || null,
      servico_nome: form.servico_nome || null,
      horas: form.horas ? Number(form.horas) : null,
      quartos: form.quartos ? Number(form.quartos) : null,
      banheiros: form.banheiros ? Number(form.banheiros) : null,
      valor: Number(form.valor),
      status: form.status,
      recorrencia: form.recorrencia,
      endereco: form.endereco || null,
      observacoes: form.observacoes || null,
    };

    const res = form.id
      ? await supabase.from("agendamentos").update(patch).eq("id", form.id)
      : await supabase.from("agendamentos").insert({ ...patch, origem: "manual" });
    setBusy(false);
    if (res.error) {
      flash("Erro ao salvar. Tente de novo.");
      return;
    }
    setForm(null);
    setDiaSel(form.data || diaSel);
    flash(form.id ? "Agendamento atualizado ✔" : "Agendamento criado ✔");
    await load();
  }

  async function excluir() {
    if (!confirmarDel) return;
    setBusy(true);
    const { error } = await supabase.from("agendamentos").delete().eq("id", confirmarDel.id);
    setBusy(false);
    setConfirmarDel(null);
    if (error) { flash("Erro ao excluir."); return; }
    flash("Agendamento excluído ✔");
    await load();
  }

  const inp = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-emerald-600";
  const lbl = "mb-1 block text-xs font-semibold text-ink";
  const hojeIso = iso(hoje);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="container-x flex items-center justify-between py-4">
          <span className="font-serif text-lg font-semibold text-ink">
            Calendário · <span className="text-emerald-600">Caridad</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/painel/clientes" className="font-medium text-ink-soft hover:text-ink">Clientes</Link>
            <Link href="/painel" className="font-medium text-ink-soft hover:text-ink">← Agenda</Link>
          </div>
        </div>
      </header>

      {aviso && (
        <div className="container-x pt-4">
          <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{aviso}</p>
        </div>
      )}

      <div className="container-x pt-6">
        {/* Controles do mês */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => mudarMes(-1)} className="btn-ghost px-3 py-2 text-sm">←</button>
            <h1 className="font-serif text-xl font-semibold text-ink sm:text-2xl">{MESES[mes]} {ano}</h1>
            <button onClick={() => mudarMes(1)} className="btn-ghost px-3 py-2 text-sm">→</button>
          </div>
          <button onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Hoje</button>
        </div>

        {/* Grade do calendário */}
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="grid grid-cols-7 border-b border-line bg-ivory/60">
            {DIAS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-ink-mute">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {semanas.flat().map((d) => {
              const dstr = iso(d);
              const foraMes = d.getMonth() !== mes;
              const eHoje = dstr === hojeIso;
              const lista = porDia[dstr] ?? [];
              return (
                <button
                  key={dstr}
                  onClick={() => setDiaSel(dstr)}
                  className={`min-h-[68px] border-b border-r border-line p-1.5 text-left align-top transition-colors sm:min-h-[92px] ${
                    foraMes ? "bg-ivory/40 text-ink-mute" : "hover:bg-emerald-50/50"
                  } ${diaSel === dstr ? "ring-2 ring-inset ring-emerald-500" : ""}`}
                >
                  <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${eHoje ? "bg-emerald-600 text-white" : foraMes ? "text-ink-mute" : "text-ink"}`}>
                    {d.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {lista.slice(0, 3).map((a) => (
                      <div key={a.id} className="flex items-center gap-1 truncate text-[10px] leading-tight text-ink-soft sm:text-xs">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_CLS[a.status]}`} />
                        <span className="truncate">{a.hora_inicio ? a.hora_inicio.slice(0, 5) + " " : ""}{a.clientes?.nome ?? "Cliente"}</span>
                      </div>
                    ))}
                    {lista.length > 3 && <div className="text-[10px] text-ink-mute">+{lista.length - 3}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-mute">
          {(["solicitado", "confirmado", "concluido"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_CLS[s]}`} /> {STATUS_LABEL[s]}
            </span>
          ))}
        </div>

        {/* Dia selecionado */}
        {diaSel && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">
                {(() => { const [y, m, dd] = diaSel.split("-"); return `${dd}/${m}/${y}`; })()}
              </h2>
              <button onClick={() => abrirNovo(diaSel)} className="btn-emerald px-4 py-2 text-sm">
                <IconPlus width={15} height={15} /> Novo
              </button>
            </div>
            {doDia.length === 0 ? (
              <p className="text-sm text-ink-mute">Nenhum agendamento nesse dia. Toque em “Novo” para adicionar.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {doDia.map((a) => (
                  <div key={a.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{a.clientes?.nome ?? "Cliente"}</p>
                        <p className="text-sm text-ink-mute">
                          {a.hora_inicio ? a.hora_inicio.slice(0, 5) + " · " : ""}{a.servico_nome ?? "Limpeza"}{a.horas ? ` · ${a.horas}h` : ""}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-ink-mute">
                        <span className={`h-2 w-2 rounded-full ${STATUS_CLS[a.status]}`} /> {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    <p className="mt-2 font-serif text-lg font-semibold text-ink">{fmtR$(a.valor)}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => abrirEditar(a)} className="btn-ghost px-3 py-1.5 text-xs">Editar</button>
                      <button onClick={() => setConfirmarDel(a)} className="px-3 py-1.5 text-xs text-ink-mute hover:text-red-600">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal formulário */}
      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 px-4 py-8" onClick={() => !busy && setForm(null)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-ink">{form.id ? "Editar agendamento" : "Novo agendamento"}</h3>
              <button onClick={() => setForm(null)} className="text-ink-mute hover:text-ink"><IconX width={18} height={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Cliente */}
              <div>
                <label className={lbl}>Cliente</label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className={inp}>
                  <option value="">— Novo cliente —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              {!form.cliente_id && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Nome do cliente</label>
                    <input value={form.novoNome} onChange={(e) => setForm({ ...form, novoNome: e.target.value })} className={inp} placeholder="Ex: Maria" />
                  </div>
                  <div>
                    <label className={lbl}>WhatsApp</label>
                    <input value={form.novoWhatsapp} onChange={(e) => setForm({ ...form, novoWhatsapp: e.target.value })} className={inp} placeholder="41 9..." />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Data</label>
                  <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Hora</label>
                  <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className={inp} />
                </div>
              </div>

              <div>
                <label className={lbl}>Serviço</label>
                <select value={form.servico_nome} onChange={(e) => setForm({ ...form, servico_nome: e.target.value })} className={inp}>
                  {LIMPEZAS.map((l) => (
                    <option key={l.id} value={l.nome}>{l.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Horas</label>
                  <input type="number" step="0.5" value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Quartos</label>
                  <input type="number" value={form.quartos} onChange={(e) => setForm({ ...form, quartos: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Banheiros</label>
                  <input type="number" value={form.banheiros} onChange={(e) => setForm({ ...form, banheiros: e.target.value })} className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Valor (R$)</label>
                  <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className={inp} placeholder="0,00" />
                </div>
                <div>
                  <label className={lbl}>Frequência</label>
                  <select value={form.recorrencia} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })} className={inp}>
                    <option value="pontual">Pontual</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={lbl}>Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["solicitado", "confirmado", "concluido"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        form.status === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-line bg-paper text-ink hover:border-emerald-600/50"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>Endereço</label>
                <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={inp} placeholder="Rua, nº, bairro" />
              </div>
              <div>
                <label className={lbl}>Observações</label>
                <input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className={inp} placeholder="Tipo de imóvel, notas…" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setForm(null)} disabled={busy} className="btn-ghost px-4 py-2 text-sm disabled:opacity-50">Cancelar</button>
              <button onClick={salvar} disabled={busy} className="btn-emerald px-5 py-2 text-sm disabled:opacity-50">
                <IconCheck width={15} height={15} /> {busy ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmarDel && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 px-5" onClick={() => !busy && setConfirmarDel(null)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-lg font-semibold text-ink">Excluir este agendamento?</p>
            <p className="mt-2 text-sm text-ink-soft">{confirmarDel.clientes?.nome ?? "Cliente"} · {fmtR$(confirmarDel.valor)}. Não dá para desfazer.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmarDel(null)} disabled={busy} className="btn-ghost px-4 py-2 text-sm disabled:opacity-50">Cancelar</button>
              <button onClick={excluir} disabled={busy} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {busy ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CalendarioPage() {
  return (
    <Guard>
      <Calendario />
    </Guard>
  );
}
