// Web Push do painel: assinatura no navegador de Caridad.
// A chave pública VAPID é pública por definição (a privada fica no Supabase).

export const VAPID_PUBLIC_KEY =
  "BAQzCAgJ1of44Hw28AM9jPjXEgjm8a0Xlzsy2C46ZM_3Y7uQ7z7zkjoZN9TJXpRknpr9-muARFFfJ1tFj6reexk";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSuportado() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Pede permissão e devolve a subscription (ou null se negado/não suportado). */
export async function assinarPush(): Promise<PushSubscription | null> {
  if (!pushSuportado()) return null;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return null;
  const reg = await navigator.serviceWorker.ready;
  const existente = await reg.pushManager.getSubscription();
  if (existente) return existente;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

export async function assinaturaAtual(): Promise<PushSubscription | null> {
  if (!pushSuportado()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}
