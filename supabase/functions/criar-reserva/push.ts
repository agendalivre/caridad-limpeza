// Envío de Web Push a todas las suscripciones del painel (Caridad).
import * as webpush from "jsr:@negrel/webpush@0.5.0";

// deno-lint-ignore no-explicit-any
type Supa = any;

export async function enviarPushCaridad(
  supabase: Supa,
  titulo: string,
  corpo: string,
  url = "/painel",
) {
  try {
    const { data: cfg } = await supabase
      .from("config_interna")
      .select("valor")
      .eq("chave", "vapid")
      .single();
    if (!cfg?.valor?.publicKey) return;

    const vapidKeys = await webpush.importVapidKeys(
      { publicKey: cfg.valor.publicKey, privateKey: cfg.valor.privateKey },
      { extractable: false },
    );
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: cfg.valor.contact ?? "mailto:agendlivre@gmail.com",
      vapidKeys,
    });

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, subscription");
    if (!subs?.length) return;

    await Promise.allSettled(
      subs.map(async (s: { id: string; subscription: unknown }) => {
        try {
          const subscriber = appServer.subscribe(s.subscription);
          await subscriber.pushTextMessage(
            JSON.stringify({ title: titulo, body: corpo, url }),
            {},
          );
        } catch (err) {
          // Suscripción muerta (410/404) -> se elimina para no reintentar
          // deno-lint-ignore no-explicit-any
          const e = err as any;
          const gone =
            (typeof e?.isGone === "function" && e.isGone()) ||
            e?.response?.status === 410 ||
            e?.response?.status === 404;
          if (gone) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          } else {
            console.error("push error:", e?.message ?? e);
          }
        }
      }),
    );
  } catch (err) {
    console.error("enviarPushCaridad:", err);
  }
}
