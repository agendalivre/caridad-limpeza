"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IMOVEIS,
  LIMPEZAS,
  ADICIONAIS,
  FREQUENCIAS,
  estimar,
  type TipoImovel,
  type TipoLimpeza,
  type Frequencia,
} from "@/lib/precos";
import { linkWhatsApp, mensagemReserva } from "@/lib/whatsapp";
import { slotsDisponiveis, type BlocoOcupado } from "@/lib/agenda";
import { IconPlus, IconMinus, IconWhatsApp, IconArrowRight, IconMapPin, IconCheck } from "@/components/icons";

function Stepper({
  value,
  set,
  min = 0,
  max = 8,
  disabled,
}: {
  value: number;
  set: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const btn =
    "grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-ink transition-colors hover:border-emerald-600 disabled:opacity-40 disabled:hover:border-line";
  return (
    <div className="flex items-center gap-4">
      <button type="button" className={`${btn} cursor-pointer`} onClick={() => set(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Diminuir">
        <IconMinus width={18} height={18} />
      </button>
      <span className="w-6 text-center font-serif text-xl font-semibold text-ink">{value}</span>
      <button type="button" className={`${btn} cursor-pointer`} onClick={() => set(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Aumentar">
        <IconPlus width={18} height={18} />
      </button>
    </div>
  );
}

export default function Reservar() {
  const [imovel, setImovel] = useState<TipoImovel>("apartamento");
  const [quartos, setQuartos] = useState(2);
  const [banheiros, setBanheiros] = useState(1);
  const [tipoLimpeza, setTipoLimpeza] = useState<TipoLimpeza>("padrao");
  const [adicionais, setAdicionais] = useState<string[]>([]);
  const [freq, setFreq] = useState<Frequencia>("pontual");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-spam
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cepMsg, setCepMsg] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [ocupado, setOcupado] = useState<BlocoOcupado[]>([]);

  // Agenda real de Caridad: blocos ocupados (sem dados de clientes)
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    fetch(`${base}/functions/v1/disponibilidade`)
      .then((r) => r.json())
      .then((j) => setOcupado(Array.isArray(j?.ocupado) ? j.ocupado : []))
      .catch(() => {});
  }, []);

  const isStudio = imovel === "studio";
  const isPassadoria = tipoLimpeza === "passadoria";

  function selImovel(id: TipoImovel) {
    setImovel(id);
    if (id === "studio") setQuartos(1);
  }

  async function buscarCep(v: string) {
    setCep(v);
    const d = v.replace(/\D/g, "");
    if (d.length !== 8) return;
    setCepMsg("Buscando…");
    // 1) AwesomeAPI: endereço + coordenadas (habilita Maps/Moovit no painel)
    try {
      const r = await fetch(`https://cep.awesomeapi.com.br/json/${d}`);
      if (r.ok) {
        const j = await r.json();
        if (j.address || j.district) {
          if (j.address) setLogradouro(j.address);
          if (j.district) setBairro(j.district);
          if (j.lat && j.lng) {
            setLat(String(j.lat));
            setLng(String(j.lng));
          }
          setCepMsg("");
          return;
        }
      }
    } catch {
      /* tenta ViaCEP abaixo */
    }
    // 2) Fallback ViaCEP (sem coordenadas)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) {
        setCepMsg("CEP não encontrado.");
      } else {
        setLogradouro(j.logradouro || "");
        setBairro(j.bairro || "");
        setCepMsg("");
      }
    } catch {
      setCepMsg("Não consegui buscar agora — preencha manualmente.");
    }
  }

  const orc = useMemo(
    () => estimar({ imovel, tipoLimpeza, quartos, banheiros, adicionais, freq }),
    [imovel, tipoLimpeza, quartos, banheiros, adicionais, freq]
  );

  // Horários realmente livres na agenda de Caridad para a data escolhida
  const slots = useMemo(
    () => slotsDisponiveis(data, orc.horas, ocupado),
    [data, orc.horas, ocupado]
  );
  const hojeISO = new Date().toLocaleDateString("sv-SE");

  const enderecoStr = [logradouro, numero && `nº ${numero}`, complemento, bairro]
    .filter(Boolean)
    .join(", ");

  const FN = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") + "/functions/v1/criar-reserva";

  // Guarda a reserva na agenda de Caridad (além de abrir o WhatsApp).
  function salvarReserva() {
    if (hp) return; // bot
    const payload = {
      nome,
      whatsapp: telefone,
      servico: orc.servico,
      quartos,
      banheiros,
      adicionais: adicionais.map((id) => ADICIONAIS.find((a) => a.id === id)?.nome ?? id),
      horas: orc.horas,
      valor: orc.total,
      frequencia: freq,
      endereco: enderecoStr,
      bairro,
      cep,
      lat,
      lng,
      data,
      hora,
      observacoes: IMOVEIS.find((i) => i.id === imovel)?.nome ?? imovel,
      website: hp,
    };
    try {
      fetch(FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      /* silencioso — o WhatsApp abre de qualquer forma */
    }
  }

  const whatsappHref = linkWhatsApp(
    mensagemReserva({
      nome: nome || "(cliente)",
      imovel: IMOVEIS.find((i) => i.id === imovel)?.nome ?? imovel,
      quartos,
      banheiros,
      servico: orc.servico,
      adicionais: adicionais.map((id) => ADICIONAIS.find((a) => a.id === id)?.nome ?? id),
      horas: orc.horas,
      cep,
      endereco: enderecoStr,
      data,
      hora,
      frequencia: FREQUENCIAS.find((f) => f.id === freq)?.label ?? "Pontual",
      total: orc.total,
    })
  );

  const label = "mb-2 block text-sm font-semibold text-ink";
  const input =
    "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-emerald-600";

  return (
    <main className="relative min-h-screen overflow-x-hidden pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="aurora animate-drift h-80 w-80 bg-emerald-100/70" style={{ top: "-4rem", right: "-4rem" }} />
      </div>

      <header className="container-x flex items-center justify-between py-5">
        <Link href="/" className="font-serif text-lg font-semibold text-ink">
          Caridad <span className="text-emerald-600">Ceregido</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Voltar
        </Link>
      </header>

      <div className="container-x mt-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="eyebrow mb-4">Orçamento em segundos</p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
            Monte a sua limpeza
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Escolha os detalhes e veja o valor na hora. Depois é só enviar pelo
            WhatsApp que eu confirmo tudo com você. 😊
          </p>
        </motion.div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ---------- FORMULÁRIO ---------- */}
          <div className="space-y-8">
            {/* Imóvel */}
            <section className="card p-6 sm:p-7">
              <h2 className="font-serif text-xl font-semibold text-ink">1. Seu imóvel</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {IMOVEIS.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => selImovel(i.id)}
                    className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                      imovel === i.id
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-line bg-paper text-ink hover:border-emerald-600/50"
                    }`}
                  >
                    {i.nome}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                <span className={label + " mb-0"}>Quartos {isStudio && <em className="font-normal text-ink-mute">(studio)</em>}</span>
                <Stepper value={quartos} set={setQuartos} min={isStudio ? 1 : 0} max={8} disabled={isStudio} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <span className={label + " mb-0"}>Banheiros</span>
                <Stepper value={banheiros} set={setBanheiros} min={1} max={8} />
              </div>

              <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-ink-soft">
                <IconCheck width={16} height={16} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>
                  <b className="font-semibold text-ink">Já incluído:</b> cozinha, sala, área de
                  serviço e áreas comuns — além dos quartos e banheiros que você informar.
                </span>
              </p>
            </section>

            {/* Tipo de limpeza */}
            <section className="card p-6 sm:p-7">
              <h2 className="font-serif text-xl font-semibold text-ink">2. Tipo de limpeza</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {LIMPEZAS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setTipoLimpeza(l.id)}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      tipoLimpeza === l.id
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-line bg-paper hover:border-emerald-600/50"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{l.nome}</span>
                    <span className="block text-xs text-ink-mute">{l.desc}</span>
                  </button>
                ))}
              </div>
              {isPassadoria && (
                <p className="mt-4 text-sm text-ink-mute">
                  Passadoria é cobrada por tempo — o número de cômodos não altera o valor.
                </p>
              )}
            </section>

            {/* Adicionais */}
            <section className="card p-6 sm:p-7">
              <h2 className="font-serif text-xl font-semibold text-ink">3. Adicionais</h2>
              <p className="mt-1 text-sm text-ink-mute">Tarefas extras, além da limpeza completa — cada uma soma um pouco de tempo.</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {ADICIONAIS.map((a) => {
                  const on = adicionais.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setAdicionais((prev) =>
                          on ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        )
                      }
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                        on
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-line bg-paper text-ink hover:border-emerald-600/50"
                      }`}
                    >
                      {a.nome}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Endereço + agendamento */}
            <section className="card p-6 sm:p-7">
              <h2 className="font-serif text-xl font-semibold text-ink">4. Endereço e horário</h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nome" className={label}>Seu nome</label>
                  <input id="nome" className={input} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como posso te chamar?" />
                </div>
                <div>
                  <label htmlFor="telefone" className={label}>WhatsApp / telefone</label>
                  <input id="telefone" inputMode="tel" className={input} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(41) 90000-0000" />
                </div>
                {/* honeypot anti-spam (oculto) */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="sm:col-span-2">
                  <label htmlFor="cep" className={label}>CEP</label>
                  <div className="relative">
                    <input id="cep" inputMode="numeric" className={input + " pr-9"} value={cep} onChange={(e) => buscarCep(e.target.value)} placeholder="00000-000" />
                    <IconMapPin width={17} height={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  </div>
                  {cepMsg && <p className="mt-1 text-xs text-ink-mute">{cepMsg}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="logradouro" className={label}>Rua / Logradouro</label>
                  <input id="logradouro" className={input} value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Preenchido pelo CEP" />
                </div>
                <div>
                  <label htmlFor="numero" className={label}>Número</label>
                  <input id="numero" className={input} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" />
                </div>
                <div>
                  <label htmlFor="complemento" className={label}>Complemento</label>
                  <input id="complemento" className={input} value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco…" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="bairro" className={label}>Bairro</label>
                  <input id="bairro" className={input} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Preenchido pelo CEP" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="data" className={label}>Data</label>
                  <input
                    id="data"
                    type="date"
                    min={hojeISO}
                    className={input}
                    value={data}
                    onChange={(e) => {
                      setData(e.target.value);
                      setHora("");
                    }}
                  />
                </div>
                {data && (
                  <div className="sm:col-span-2">
                    <span className={label}>Horários disponíveis</span>
                    {slots.length === 0 ? (
                      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Esse dia já está cheio para um serviço de ~{orc.horas}h — escolha outra
                        data, ou envie mesmo assim que combinamos pelo WhatsApp. 😊
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slots.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setHora(hora === s ? "" : s)}
                            className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                              hora === s
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-line bg-paper text-ink hover:border-emerald-600/50"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className={label + " mt-6"}>Frequência</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FREQUENCIAS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFreq(f.id)}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                      freq === f.id
                        ? "border-emerald-600 bg-emerald-50 font-semibold text-ink"
                        : "border-line bg-paper text-ink hover:border-emerald-600/50"
                    }`}
                  >
                    {f.label}
                    {f.nota && <span className="ml-1 text-xs text-emerald-600">{f.nota}</span>}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ---------- RESUMO STICKY ---------- */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-3xl bg-ink p-7 text-ivory">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                Seu orçamento
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-serif text-5xl font-semibold">
                  R$ {orc.total.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="mt-1 text-sm text-ivory/60">
                Duração estimada: <b className="text-ivory">~{orc.horas}h</b>
              </p>

              {orc.desconto > 0 && (
                <p className="mt-3 rounded-lg bg-emerald-600/25 px-3 py-2 text-sm text-emerald-50">
                  Você economiza R$ {orc.desconto.toFixed(2).replace(".", ",")} pela fidelidade 🎉
                </p>
              )}

              <div className="mt-5 space-y-1.5 border-t border-white/10 pt-5 text-sm text-ivory/70">
                <p>{orc.servico}</p>
                {!isPassadoria && <p>{quartos} quarto(s) · {banheiros} banheiro(s)</p>}
                {adicionais.length > 0 && <p>{adicionais.length} adicional(is)</p>}
              </div>

              <a href={whatsappHref} onClick={salvarReserva} target="_blank" rel="noopener noreferrer" className="btn-emerald btn-lg mt-6 w-full">
                <IconWhatsApp width={19} height={19} />
                Enviar pelo WhatsApp
                <IconArrowRight width={17} height={17} />
              </a>
              <p className="mt-3 text-center text-xs text-ivory/50">
                Valor e duração são estimativas e podem variar conforme o estado do imóvel. Confirmamos tudo com você pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
