// Lembretes automáticos (via pg_cron): push para Caridad com os serviços de
// hoje (7h BRT) ou de amanhã (18h BRT).
// Inclui os clientes RECORRENTES projetados para a data (semanal/quinzenal/
// mensal) e respeita as EXCEÇÕES (ocorrência movida/cancelada num dia).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { enviarPushCaridad } from "./push.ts";

// Fecha local de Curitiba (America/Sao_Paulo) com offset em dias.
function dataBRT(offsetDias: number) {
  const d = new Date(Date.now() + offsetDias * 86400000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(d);
}

// Datas futuras geradas por uma recorrência (semanal +7, quinzenal +14, mensal +1 mês).
function ocorrencias(dataBase: string, recorrencia: string | null, horizonteDias = 400): string[] {
  if (!dataBase || !recorrencia || recorrencia === "pontual") return [];
  const base = new Date(dataBase + "T00:00:00Z");
  if (isNaN(base.getTime())) return [];
  const limite = new Date(base);
  limite.setUTCDate(limite.getUTCDate() + horizonteDias);
  const out: string[] = [];
  const d = new Date(base);
  for (let i = 0; i < 500; i++) {
    if (recorrencia === "mensal") d.setUTCMonth(d.getUTCMonth() + 1);
    else if (recorrencia === "quinzenal") d.setUTCDate(d.getUTCDate() + 14);
    else if (recorrencia === "semanal") d.setUTCDate(d.getUTCDate() + 7);
    else break;
    if (d > limite) break;
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Só o pg_cron (ou Caridad com o secret) pode disparar isto.
  const { data: cfg } = await supabase
    .from("config_interna")
    .select("valor")
    .eq("chave", "lembretes")
    .single();
  if (!cfg || req.headers.get("x-lembrete-secret") !== cfg.valor?.secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  let quando = "amanha";
  try {
    const b = await req.json();
    if (b?.quando === "hoje") quando = "hoje";
  } catch { /* default amanha */ }

  const alvo = quando === "hoje" ? dataBRT(0) : dataBRT(1);

  // Confirmados com data = alvo + recorrentes (para projetar) + exceções.
  const { data: rows, error } = await supabase
    .from("agendamentos")
    .select("id, data, hora_inicio, servico_nome, horas, status, recorrencia, serie_id, data_original, clientes(nome, bairro)")
    .or(`data.eq.${alvo},recorrencia.neq.pontual,data_original.not.is.null`);
  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const rowsArr = rows ?? [];
  const excecoes = new Set<string>();
  for (const a of rowsArr) {
    if (a.serie_id && a.data_original) excecoes.add(`${a.serie_id}|${a.data_original}`);
  }

  // deno-lint-ignore no-explicit-any
  const doDia: any[] = [];
  for (const a of rowsArr) {
    if (a.status !== "confirmado") continue;
    if (a.data === alvo) {
      doDia.push(a); // pontual, materializado ou base que calha hoje
      continue;
    }
    // Ocorrência recorrente que cai em `alvo`.
    if (a.recorrencia && a.recorrencia !== "pontual" && a.data && a.data < alvo) {
      for (const f of ocorrencias(a.data, a.recorrencia)) {
        if (f > alvo) break;
        if (f === alvo) {
          if (!excecoes.has(`${a.id}|${alvo}`)) doDia.push(a);
          break;
        }
      }
    }
  }

  if (!doDia.length) {
    return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  doDia.sort((x, y) =>
    String(x.hora_inicio ?? "").localeCompare(String(y.hora_inicio ?? "")),
  );

  // deno-lint-ignore no-explicit-any
  const linha = (a: any) => {
    const c = Array.isArray(a.clientes) ? a.clientes[0] : a.clientes;
    return `${a.hora_inicio ? a.hora_inicio.slice(0, 5) : "horário a combinar"} · ${c?.nome ?? "Cliente"}${c?.bairro ? " (" + c.bairro + ")" : ""}`;
  };

  const titulo =
    quando === "hoje"
      ? `Bom dia! Hoje: ${doDia.length} serviço(s)`
      : `Amanhã: ${doDia.length} serviço(s) — lembre os clientes!`;
  const corpo = doDia.map(linha).join("\n");

  await enviarPushCaridad(supabase, titulo, corpo, "/painel");

  // Registro (log simples do envio).
  await supabase.from("lembretes").insert(
    // deno-lint-ignore no-explicit-any
    doDia.map((a: any) => ({
      agendamento_id: a.id,
      enviar_em: new Date().toISOString(),
      canal: "push",
      enviado: true,
    })),
  );

  return new Response(JSON.stringify({ ok: true, enviados: doDia.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
