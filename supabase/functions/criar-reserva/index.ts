import { createClient } from "jsr:@supabase/supabase-js@2";
import { enviarPushCaridad } from "./push.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const b = await req.json();

    const nome = String(b.nome ?? "").trim();
    const whatsapp = String(b.whatsapp ?? "").replace(/\D/g, "");
    if (nome.length < 2 || whatsapp.length < 10) {
      return new Response(JSON.stringify({ error: "dados invalidos" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (b.website) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cliente, error: e1 } = await supabase
      .from("clientes")
      .upsert(
        {
          nome,
          whatsapp,
          endereco: b.endereco ?? null,
          bairro: b.bairro ?? null,
          cep: b.cep ?? null,
          lat: num(b.lat),
          lng: num(b.lng),
        },
        { onConflict: "whatsapp" },
      )
      .select()
      .single();
    if (e1) throw e1;

    const freqValidas = ["pontual", "mensal", "quinzenal", "semanal"];
    const recorrencia = freqValidas.includes(b.frequencia) ? b.frequencia : "pontual";

    const { error: e2 } = await supabase.from("agendamentos").insert({
      cliente_id: cliente.id,
      data: b.data || null,
      hora_inicio: b.hora || null,
      valor: num(b.valor) ?? 0,
      horas: num(b.horas),
      quartos: num(b.quartos),
      banheiros: num(b.banheiros),
      servico_nome: b.servico ?? null,
      adicionais: Array.isArray(b.adicionais) ? b.adicionais.join(", ") : null,
      status: "solicitado",
      origem: "web",
      recorrencia,
      endereco: b.endereco ?? null,
      observacoes: b.observacoes ?? null,
    });
    if (e2) throw e2;

    // Notifica a Caridad en su celular (no bloquea la respuesta si falla)
    const quando = b.data ? `${b.data}${b.hora ? " às " + b.hora : ""}` : "data a combinar";
    const valor = num(b.valor);
    await enviarPushCaridad(
      supabase,
      "🧼 Nova reserva!",
      `${nome} · ${b.servico ?? "Limpeza"} · ${quando}${valor ? ` · R$ ${valor.toFixed(2).replace(".", ",")}` : ""}`,
      "/painel",
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
