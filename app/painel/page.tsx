"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CONFIG } from "@/lib/config";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Guard } from "@/components/painel/Guard";
import { QrPix } from "@/components/painel/QrPix";
import { Notificacoes } from "@/components/painel/Notificacoes";
import {
  IconWhatsApp,
  IconCheck,
  IconWallet,
  IconX,
  IconMapPin,
  IconBus,
  IconPhone,
  IconCopy,
} from "@/components/icons";

type Cliente = {
  nome: string;
  whatsapp: string;
  bairro: string | null;
  endereco: string | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
};
type Agendamento = {
  id: string;
  data: string | null;
  hora_inicio: string | null;
  valor: number;
  horas: number | null;
  quartos: number | null;
  banheiros: number | null;
  status: "solicitado" | "confirmado" | "concluido" | "cancelado";
  servico_nome: string | null;
  adicionais: string | null;
  endereco: string | null;
  observacoes: string | null;
  recorrencia: string | null;
  origem: string;
  execucao: string | null;
  data2: string | null;
  clientes: Cliente | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  solicitado: { label: "Solicitado", cls: "bg-amber-100 text-amber-800" },
  confirmado: { label: "Confirmado", cls: "bg-emerald-100 text-emerald-800" },
  concluido: { label: "Concluído", cls: "bg-ink/10 text-ink-soft" },
  cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};

const isoLocal = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD local
const HOJE = () => isoLocal(new Date());
const AMANHA = () => isoLocal(new Date(Date.now() + 86400000));

const fmtR$ = (n: number) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
const fmtData = (d: string | null, h: string | null) => {
  if (!d) return "A combinar";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}${h ? ` · ${h.slice(0, 5)}` : ""}`;
};

const enderecoCompleto = (a: Agendamento) =>
  [a.endereco, a.clientes?.bairro, "Curitiba - PR"].filter(Boolean).join(", ");
const ponto = (a: Agendamento) =>
  a.clientes?.lat && a.clientes?.lng ? `${a.clientes.lat},${a.clientes.lng}` : enderecoCompleto(a);

const mapsLink = (a: Agendamento) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ponto(a))}`;
const moovitLink = (a: Agendamento) => {
  const c = a.clientes;
  const to = encodeURIComponent(a.endereco || c?.nome || "Destino");
  if (c?.lat && c?.lng) return `https://moovit.com/?to=${to}&tll=${c.lat}_${c.lng}&lang=pt-br`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(enderecoCompleto(a))}&travelmode=transit`;
};
const telLink = (a: Agendamento) => `tel:+${(a.clientes?.whatsapp ?? "").replace(/\D/g, "")}`;

const resumoTexto = (a: Agendamento) =>
  [
    `Cliente: ${a.clientes?.nome ?? ""}`,
    a.clientes?.whatsapp ? `WhatsApp: ${a.clientes.whatsapp}` : "",
    a.observacoes
      ? `Imóvel: ${a.observacoes}${a.quartos ? ` · ${a.quartos} quarto(s)` : ""}${a.banheiros ? ` · ${a.banheiros} banheiro(s)` : ""}`
      : "",
    `Serviço: ${a.servico_nome ?? "Limpeza"}${a.horas ? ` · ${a.horas}h` : ""}`,
    a.adicionais ? `Adicionais: ${a.adicionais}` : "",
    a.endereco ? `Endereço: ${a.endereco}${a.clientes?.cep ? ` (CEP ${a.clientes.cep})` : ""}` : "",
    `Quando: ${fmtData(a.data, a.hora_inicio)}`,
    `Frequência: ${a.recorrencia ?? "pontual"}`,
    `Valor: ${fmtR$(a.valor)}`,
  ]
    .filter(Boolean)
    .join("\n");

// Rota do dia: Google Maps com várias paradas em ordem de horário.
function rotaLink(items: Agendamento[]): string | null {
  const doDia = items
    .filter((i) => i.status === "confirmado" && i.data === HOJE())
    .sort((a, b) => (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? ""));
  if (doDia.length === 0) return null;
  const pts = doDia.map(ponto);
  const destination = encodeURIComponent(pts[pts.length - 1]);
  const waypoints = pts.slice(0, -1).map(encodeURIComponent).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  return url;
}

function Card({
  a,
  busy,
  onStatus,
  onPago,
  onCancelar,
  onPix,
  onQuando,
  onExecucao,
  onData2,
}: {
  a: Agendamento;
  busy: boolean;
  onStatus: (id: string, s: string) => void;
  onPago: (a: Agendamento) => void;
  onCancelar: (a: Agendamento) => void;
  onPix: (a: Agendamento) => void;
  onQuando: (id: string, data: string, hora: string) => void;
  onExecucao: (id: string, execucao: string) => void;
  onData2: (id: string, data2: string) => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState(a.data ?? "");
  const [h, setH] = useState(a.hora_inicio ? a.hora_inicio.slice(0, 5) : "");
  const [d2, setD2] = useState(a.data2 ?? "");
  const exec = a.execucao ?? "um_dia";
  const ativo = a.status === "solicitado" || a.status === "confirmado";

  const linhas: [string, string][] = [];
  if (a.observacoes || a.quartos || a.banheiros)
    linhas.push([
      "Imóvel",
      [a.observacoes, a.quartos ? `${a.quartos} quarto(s)` : "", a.banheiros ? `${a.banheiros} banheiro(s)` : ""]
        .filter(Boolean)
        .join(" · "),
    ]);
  if (a.adicionais) linhas.push(["Adicionais", a.adicionais]);
  if (a.endereco) linhas.push(["Endereço", `${a.endereco}${a.clientes?.cep ? ` — CEP ${a.clientes.cep}` : ""}`]);
  linhas.push(["Frequência", a.recorrencia ?? "pontual"]);
  if (a.clientes?.whatsapp) linhas.push(["Telefone", a.clientes.whatsapp]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resumoTexto(a));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  }

  const nav = "btn-ghost px-3 py-2 text-xs";
  const act = "px-4 py-2 text-xs";
  const inp = "rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-emerald-600";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg font-semibold text-ink">{a.clientes?.nome ?? "Cliente"}</p>
          <p className="text-sm text-ink-mute">
            {a.servico_nome ?? "Limpeza"}
            {a.horas ? ` · ${a.horas}h` : ""}
            {a.origem === "web" ? " · pelo site" : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[a.status].cls}`}>
          {STATUS[a.status].label}
        </span>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
        {linhas.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-24 shrink-0 text-ink-mute">{k}</dt>
            <dd className="flex-1 text-ink-soft">{v}</dd>
          </div>
        ))}

        {/* Quando (editável) */}
        <div className="flex items-center gap-2">
          <dt className="w-24 shrink-0 text-ink-mute">Quando</dt>
          <dd className="flex-1">
            {!edit ? (
              <span className="text-ink-soft">
                {fmtData(a.data, a.hora_inicio)}
                {ativo && (
                  <button onClick={() => setEdit(true)} className="ml-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    editar
                  </button>
                )}
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={d} onChange={(e) => setD(e.target.value)} className={inp} />
                <input type="time" value={h} onChange={(e) => setH(e.target.value)} className={inp} />
                <button
                  onClick={() => {
                    onQuando(a.id, d, h);
                    setEdit(false);
                  }}
                  className={`btn-emerald ${act}`}
                >
                  Salvar
                </button>
                <button onClick={() => setEdit(false)} className="text-xs text-ink-mute">cancelar</button>
              </div>
            )}
          </dd>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <dt className="w-24 shrink-0 text-ink-mute">Valor</dt>
          <dd className="font-serif text-xl font-semibold text-ink">{fmtR$(a.valor)}</dd>
        </div>
      </dl>

      {ativo && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <a href={mapsLink(a)} target="_blank" rel="noopener noreferrer" className={nav}>
            <IconMapPin width={15} height={15} /> Mapa
          </a>
          <a href={moovitLink(a)} target="_blank" rel="noopener noreferrer" className={nav}>
            <IconBus width={15} height={15} /> Ônibus
          </a>
          <a href={telLink(a)} className={nav}>
            <IconPhone width={15} height={15} /> Ligar
          </a>
          <button onClick={copiar} className={nav}>
            <IconCopy width={15} height={15} /> {copiado ? "Copiado!" : "Copiar dados"}
          </button>
        </div>
      )}

      {/* Execução — serviços longos (Caridad trabalha sozinha) */}
      {ativo && (
        <div className="mt-4 border-t border-line pt-4">
          {a.horas && a.horas >= 8 && exec === "um_dia" && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Serviço longo (~{a.horas}h) — considere dividir em 2 dias ou levar ajudante.
            </p>
          )}
          <p className="mb-2 text-xs font-semibold text-ink">Execução</p>
          <div className="flex flex-wrap gap-2">
            {([
              ["um_dia", "1 dia"],
              ["dois_dias", "2 dias"],
              ["ajudante", "Com ajudante"],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => onExecucao(a.id, v)}
                disabled={busy}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                  exec === v
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-line bg-paper text-ink hover:border-emerald-600/50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {exec === "dois_dias" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-mute">2º dia:</span>
              <input
                type="date"
                value={d2}
                onChange={(e) => setD2(e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-emerald-600"
              />
              <button onClick={() => onData2(a.id, d2)} disabled={busy} className="btn-emerald px-3 py-1.5 text-xs disabled:opacity-50">
                Salvar 2º dia
              </button>
              {a.data2 && <span className="text-xs text-ink-mute">✓ {fmtData(a.data2, null)}</span>}
            </div>
          )}
          {exec === "ajudante" && (
            <p className="mt-2 text-xs text-ink-mute">
              Com ajudante o tempo de relógio cai ~pela metade (o trabalho total é o mesmo).
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {a.status === "solicitado" && (
          <button onClick={() => onStatus(a.id, "confirmado")} disabled={busy} className={`btn-emerald ${act} disabled:opacity-50`}>
            <IconCheck width={15} height={15} /> Confirmar
          </button>
        )}
        {a.status === "confirmado" && (
          <button onClick={() => onStatus(a.id, "concluido")} disabled={busy} className={`btn-ink ${act} disabled:opacity-50`}>
            <IconCheck width={15} height={15} /> Concluir
          </button>
        )}
        {ativo && (
          <>
            <a
              href={linkWhatsApp(
                `Olá ${a.clientes?.nome ?? ""}! 😊 Passando para lembrar da sua limpeza${a.data ? ` em ${fmtData(a.data, a.hora_inicio)}` : ""}. Qualquer coisa me avise. — ${CONFIG.primeiroNome}`,
                a.clientes?.whatsapp
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-ghost ${act}`}
            >
              <IconWhatsApp width={15} height={15} /> Lembrete
            </a>
            <button onClick={() => onPix(a)} className={`btn-ghost ${act}`}>
              <IconWallet width={15} height={15} /> Cobrar Pix
            </button>
            <button onClick={() => onPago(a)} disabled={busy} className={`btn-ghost ${act} disabled:opacity-50`}>
              Marcar pago
            </button>
            <button onClick={() => onCancelar(a)} disabled={busy} className="px-3 py-2 text-xs text-ink-mute hover:text-red-600">
              <IconX width={14} height={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Secao({ titulo, n, vazio, destaque, children }: { titulo: string; n: number; vazio: string; destaque?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-serif text-2xl font-semibold text-ink">{titulo}</h2>
        {n > 0 && (
          <span className={`grid h-6 min-w-6 place-items-center rounded-full px-2 text-xs font-semibold text-white ${destaque ? "bg-amber-500" : "bg-emerald-600"}`}>{n}</span>
        )}
      </div>
      {n === 0 ? vazio && <p className="text-sm text-ink-mute">{vazio}</p> : <div className="grid gap-4 sm:grid-cols-2">{children}</div>}
    </section>
  );
}

function Painel() {
  const router = useRouter();
  const [items, setItems] = useState<Agendamento[]>([]);
  const [ganho, setGanho] = useState(0);
  const [nPagos, setNPagos] = useState(0);
  const [ganhoAnterior, setGanhoAnterior] = useState(0);
  const [aReceber, setAReceber] = useState(0);
  const [nAReceber, setNAReceber] = useState(0);
  const [semanaValor, setSemanaValor] = useState(0);
  const [semanaN, setSemanaN] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [pix, setPix] = useState<{ valor: number; desc: string } | null>(null);
  const [aviso, setAviso] = useState("");
  const [confirmacao, setConfirmacao] = useState<{ tipo: "cancelar" | "pago"; a: Agendamento } | null>(null);

  const load = useCallback(async () => {
    const [ag, pg] = await Promise.all([
      supabase
        .from("agendamentos")
        .select("*, clientes(nome, whatsapp, bairro, endereco, cep, lat, lng)")
        .order("criado_em", { ascending: false }),
      supabase.from("pagamentos").select("valor, pago_em, status, agendamento_id"),
    ]);
    const lista = (ag.data as Agendamento[]) ?? [];
    setItems(lista);

    type Pg = { status: string; pago_em: string | null; valor: number; agendamento_id: string | null };
    const pgs = (pg.data ?? []) as Pg[];
    const soma = (xs: { valor: number }[]) => xs.reduce((s, p) => s + Number(p.valor), 0);

    // Ganhos deste mês vs mês passado
    const mes = HOJE().slice(0, 7);
    const dAnt = new Date();
    dAnt.setDate(1);
    dAnt.setMonth(dAnt.getMonth() - 1);
    const mesAnt = isoLocal(dAnt).slice(0, 7);
    const pagos = pgs.filter((p) => p.status === "pago" && (p.pago_em ?? "").startsWith(mes));
    setGanho(soma(pagos));
    setNPagos(pagos.length);
    setGanhoAnterior(soma(pgs.filter((p) => p.status === "pago" && (p.pago_em ?? "").startsWith(mesAnt))));

    // A receber: concluídos sem pagamento registrado
    const idsPagos = new Set(pgs.filter((p) => p.status === "pago").map((p) => p.agendamento_id));
    const pendentes = lista.filter((a) => a.status === "concluido" && !idsPagos.has(a.id));
    setAReceber(soma(pendentes));
    setNAReceber(pendentes.length);

    // Próximos 7 dias (confirmados)
    const fim = isoLocal(new Date(Date.now() + 7 * 86400000));
    const semana = lista.filter(
      (a) => a.status === "confirmado" && a.data && a.data >= HOJE() && a.data <= fim
    );
    setSemanaValor(soma(semana));
    setSemanaN(semana.length);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Realtime: atualiza a agenda sozinha quando chega/muda uma reserva.
    const canal = supabase
      .channel("painel-agendamentos")
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [load]);

  async function mudarStatus(id: string, status: string) {
    setBusy(id);
    await supabase.from("agendamentos").update({ status }).eq("id", id);
    await load();
    setBusy(null);
  }

  async function salvarQuando(id: string, data: string, hora: string) {
    setBusy(id);
    await supabase.from("agendamentos").update({ data: data || null, hora_inicio: hora || null }).eq("id", id);
    await load();
    setBusy(null);
    setAviso("Data/horário atualizado ✔");
    setTimeout(() => setAviso(""), 2500);
  }

  async function salvarExecucao(id: string, execucao: string) {
    setBusy(id);
    const patch: { execucao: string; data2?: null } = { execucao };
    if (execucao !== "dois_dias") patch.data2 = null;
    await supabase.from("agendamentos").update(patch).eq("id", id);
    await load();
    setBusy(null);
  }

  async function salvarData2(id: string, data2: string) {
    setBusy(id);
    await supabase.from("agendamentos").update({ data2: data2 || null }).eq("id", id);
    await load();
    setBusy(null);
    setAviso("2º dia salvo ✔");
    setTimeout(() => setAviso(""), 2500);
  }

  async function marcarPago(a: Agendamento) {
    setBusy(a.id);
    await supabase.from("pagamentos").insert({
      agendamento_id: a.id,
      valor: a.valor,
      status: "pago",
      pago_em: new Date().toISOString(),
    });
    await load();
    setBusy(null);
    setAviso("Pagamento registrado ✔");
    setTimeout(() => setAviso(""), 2500);
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/painel/login");
  }

  const onPix = (x: Agendamento) => setPix({ valor: x.valor, desc: x.servico_nome ?? "Limpeza" });

  async function executarConfirmacao() {
    if (!confirmacao) return;
    const { tipo, a } = confirmacao;
    setConfirmacao(null);
    if (tipo === "pago") await marcarPago(a);
    else await mudarStatus(a.id, "cancelado");
  }

  const solicitacoes = items.filter((i) => i.status === "solicitado");
  const amanha = items.filter((i) => i.status === "confirmado" && i.data === AMANHA());
  const agendados = items.filter((i) => i.status === "confirmado" && i.data !== AMANHA());
  const outros = items.filter((i) => i.status === "concluido" || i.status === "cancelado").slice(0, 12);
  const rota = rotaLink(items);

  const render = (a: Agendamento) => (
    <Card
      key={a.id}
      a={a}
      busy={busy === a.id}
      onStatus={mudarStatus}
      onPago={(x) => setConfirmacao({ tipo: "pago", a: x })}
      onCancelar={(x) => setConfirmacao({ tipo: "cancelar", a: x })}
      onPix={onPix}
      onQuando={salvarQuando}
      onExecucao={salvarExecucao}
      onData2={salvarData2}
    />
  );

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="container-x flex items-center justify-between py-4">
          <span className="font-serif text-lg font-semibold text-ink">
            Agenda · <span className="text-emerald-600">Caridad</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/painel/calendario" className="font-medium text-ink-soft hover:text-ink">Calendário</Link>
            <Link href="/painel/qr" className="font-medium text-ink-soft hover:text-ink">Meu QR</Link>
            <Link href="/painel/clientes" className="font-medium text-ink-soft hover:text-ink">Clientes</Link>
            <button onClick={sair} className="font-medium text-ink-mute hover:text-ink">Sair</button>
          </div>
        </div>
      </header>

      {/* Painel do mês + rota de hoje */}
      <div className="container-x grid grid-cols-2 gap-3 pt-6 lg:grid-cols-4">
        <div className="card px-5 py-3">
          <span className="text-xs text-ink-mute">Ganhei este mês</span>
          <p className="font-serif text-2xl font-semibold text-ink">{fmtR$(ganho)}</p>
          <p className="text-xs text-ink-mute">
            {nPagos} pago(s)
            {ganhoAnterior > 0 && (
              <span className={ganho >= ganhoAnterior ? "text-emerald-600" : "text-amber-600"}>
                {" "}· {ganho >= ganhoAnterior ? "▲" : "▼"} vs {fmtR$(ganhoAnterior)} mês passado
              </span>
            )}
          </p>
        </div>
        <div className="card px-5 py-3">
          <span className="text-xs text-ink-mute">A receber</span>
          <p className={`font-serif text-2xl font-semibold ${aReceber > 0 ? "text-amber-600" : "text-ink"}`}>
            {fmtR$(aReceber)}
          </p>
          <p className="text-xs text-ink-mute">
            {nAReceber > 0 ? `${nAReceber} serviço(s) concluído(s) sem pagamento` : "Tudo em dia ✔"}
          </p>
        </div>
        <div className="card px-5 py-3">
          <span className="text-xs text-ink-mute">Próximos 7 dias</span>
          <p className="font-serif text-2xl font-semibold text-ink">{fmtR$(semanaValor)}</p>
          <p className="text-xs text-ink-mute">{semanaN} serviço(s) confirmado(s)</p>
        </div>
        {rota ? (
          <a href={rota} target="_blank" rel="noopener noreferrer" className="btn-ink flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm">
            <IconMapPin width={17} height={17} /> Rota de hoje
          </a>
        ) : (
          <div className="card grid place-items-center px-5 py-3 text-sm text-ink-mute">
            Sem rota hoje
          </div>
        )}
      </div>

      {aviso && (
        <div className="container-x pt-4">
          <p className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white">{aviso}</p>
        </div>
      )}

      <div className="container-x pt-4">
        <Notificacoes />
      </div>

      <div className="container-x space-y-10 pt-8">
        {loading ? (
          <p className="text-ink-mute">Carregando agenda…</p>
        ) : (
          <>
            <Secao titulo="Novas solicitações" n={solicitacoes.length} vazio="Nenhuma solicitação nova.">
              {solicitacoes.map(render)}
            </Secao>
            <Secao titulo="Para amanhã — lembrar" n={amanha.length} vazio="" destaque>
              {amanha.map(render)}
            </Secao>
            <Secao titulo="Agendados" n={agendados.length} vazio="Nada mais confirmado.">
              {agendados.map(render)}
            </Secao>
            {outros.length > 0 && (
              <Secao titulo="Histórico" n={outros.length} vazio="">
                {outros.map(render)}
              </Secao>
            )}
          </>
        )}
      </div>

      {pix && <QrPix valor={pix.valor} descricao={pix.desc} onClose={() => setPix(null)} />}

      {confirmacao && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-5" onClick={() => setConfirmacao(null)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-lg font-semibold text-ink">
              {confirmacao.tipo === "pago" ? "Marcar como pago?" : "Cancelar este agendamento?"}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {confirmacao.a.clientes?.nome ?? "Cliente"} · {fmtR$(confirmacao.a.valor)}
              {confirmacao.tipo === "pago"
                ? " — registra o pagamento na sua conta do mês."
                : " — ele sai da agenda."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmacao(null)} className="btn-ghost px-4 py-2 text-sm">Voltar</button>
              <button
                onClick={executarConfirmacao}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                  confirmacao.tipo === "pago" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmacao.tipo === "pago" ? "Sim, marcar pago" : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PainelPage() {
  return (
    <Guard>
      <Painel />
    </Guard>
  );
}
