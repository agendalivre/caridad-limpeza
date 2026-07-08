// Público (somente leitura): blocos ocupados da agenda nos próximos meses.
// Não expõe nenhum dado de cliente — só data, hora e duração.
// Inclui as PROJEÇÕES de clientes recorrentes (semanal/quinzenal/mensal) e
// respeita EXCEÇÕES (ocorrência movida ou cancelada só num dia).
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};

// Datas futuras geradas por uma recorrência (semanal +7, quinzenal +14, mensal +1 mês).
function ocorrencias(dataBase: string, recorrencia: string | null, horizonteDias = 120): string[] {
  if (!dataBase || !recorrencia || recorrencia === "pontual") return [];
  const base = new Date(dataBase + "T00:00:00Z");
  if (isNaN(base.getTime())) return [];
  const limite = new Date(base);
  limite.setUTCDate(limite.getUTCDate() + horizonteDias);
  const out: string[] = [];
  const d = new Date(base);
  for (let i = 0; i < 60; i++) {
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const hoje = new Date().toISOString().slice(0, 10);
    // Puntuais futuros + recorrentes (para projetar) + exceções (data_original).
    const { data, error } = await supabase
      .from("agendamentos")
      .select("id, data, hora_inicio, horas, execucao, data2, status, recorrencia, serie_id, data_original")
      .or(`data.gte.${hoje},recorrencia.neq.pontual,data_original.not.is.null`)
      .limit(1000);
    if (error) throw error;

    const rows = data ?? [];

    // Ocorrências que foram movidas/canceladas num dia específico -> não projetar.
    const excecoes = new Set<string>();
    for (const a of rows) {
      if (a.serie_id && a.data_original) excecoes.add(`${a.serie_id}|${a.data_original}`);
    }

    type Bloco = { data: string; inicio: string | null; horas: number };
    const ocupado: Bloco[] = [];
    for (const a of rows) {
      if (a.status !== "solicitado" && a.status !== "confirmado") continue; // canceladas não ocupam
      if (!a.data) continue;
      // com ajudante o tempo de relógio cai ~pela metade
      const horas = Math.max(
        1,
        a.execucao === "ajudante" ? Number(a.horas ?? 3) / 2 : Number(a.horas ?? 3),
      );
      if (a.data >= hoje) ocupado.push({ data: a.data, inicio: a.hora_inicio, horas });
      if (a.execucao === "dois_dias" && a.data2 && a.data2 >= hoje) {
        ocupado.push({ data: a.data2, inicio: a.hora_inicio, horas });
      }
      for (const f of ocorrencias(a.data, a.recorrencia)) {
        if (f < hoje) continue;
        if (excecoes.has(`${a.id}|${f}`)) continue; // ocorrência movida ou cancelada nesse dia
        ocupado.push({ data: f, inicio: a.hora_inicio, horas });
      }
    }

    return new Response(JSON.stringify({ ocupado }), {
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ocupado: [] }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
