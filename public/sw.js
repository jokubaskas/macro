// ── Offline palaikymas ────────────────────────────────────────────────────
// Atsargi strategija: niekada neliečia API (PocketBase/push serverio)
// užklausų — tik SAVO domeno GET užklausos. Naujausias turinys visada
// pirmiausia bandomas iš tinklo; talpykla naudojama tik kaip atsarginis
// variantas, kai interneto nėra, tad nauja versija po deploy visada bus
// matoma iškart, kai yra ryšys.
const CACHE_NAME = "coachvilma-shell-v1";

const OFFLINE_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coach Vilma</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#3a0a20,#6D1B3B);font-family:-apple-system,sans-serif;color:#fff;text-align:center;padding:24px;box-sizing:border-box}</style></head><body><div><h1 style="font-size:20px;margin:0 0 8px">Nėra interneto ryšio</h1><p style="opacity:.6;font-size:14px">Prisijunkite prie interneto ir pabandykite dar kartą.</p></div></body></html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // API/push serveris ir kt. — nesiliečiame

  // Navigacija (HTML) — pirmiausia tinklas, atsarginis — talpykla, paskui paprastas offline ekranas.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {}));
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
      )
    );
    return;
  }

  // Statiniai resursai (JS/CSS/paveikslėliai) — stale-while-revalidate: iš
  // karto atsakyti iš talpyklos (jei yra), fone atnaujinti sekančiam kartui.
  event.respondWith(
    caches.match(req).then((cached) => {
      const updateCache = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => null);

      if (cached) {
        event.waitUntil(updateCache);
        return cached;
      }
      return updateCache.then((res) => res || Response.error());
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "CoachVilma", body: "", url: "https://coachvilma.app" };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data ? event.data.text() : "";
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url || "https://coachvilma.app" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://coachvilma.app";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("coachvilma.app") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
