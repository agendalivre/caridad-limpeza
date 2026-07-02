// Service worker: instalación PWA + caché básica offline + notificaciones push.
const CACHE = "caridad-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/")))
  );
});

// ---- Web Push (avisos de novas reservas / lembretes para Caridad) ----
self.addEventListener("push", (e) => {
  let data = { title: "Caridad Limpeza", body: "", url: "/painel" };
  try {
    data = { ...data, ...e.data.json() };
  } catch {
    data.body = e.data ? e.data.text() : "";
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-painel-192.png",
      badge: "/icon-painel-192.png",
      data: { url: data.url },
      tag: "caridad-" + Date.now(),
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/painel";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes("/painel") && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
