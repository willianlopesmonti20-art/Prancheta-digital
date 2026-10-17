// Guarda a prancheta no aparelho para funcionar mesmo sem internet no ginásio.
const CACHE = 'prancheta-futsal-v5';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Página: tenta a versão nova da internet, sem internet usa a guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copia = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copia)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Fontes e arquivos: usa o guardado e atualiza por trás.
  if (url.origin === location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then((guardado) => {
        const rede = fetch(req)
          .then((res) => { if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); } return res; })
          .catch(() => guardado);
        return guardado || rede;
      })
    );
  }
});
