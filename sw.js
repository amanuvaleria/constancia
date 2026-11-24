// Service worker do Constância: cache offline dos arquivos estáticos.
// Caminhos relativos para funcionar em qualquer subpasta (ex.: GitHub Pages).
const CACHE_NAME = "constancia-v12";
const ASSETS = ["./", "./index.html", "./style.css", "./app.js", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// ---------------------------------------------------------------
// Web Push: avisos de missão ("⚡ A arena abriu. Hora da sua missão de treino!")
// ---------------------------------------------------------------

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Constância", body: event.data ? event.data.text() : "Hora de treinar!" };
  }
  const title = data.title || "Constância";
  const body = data.body || "⚡ A arena abriu. Hora da sua missão de treino!";
  const profileId = data.profileId || "";
  const url = "./index.html" + (profileId ? `?profile=${encodeURIComponent(profileId)}` : "");

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./index.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
