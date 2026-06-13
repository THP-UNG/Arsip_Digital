// Service Worker — ARSIP DIGITAL THP
// Versi cache: naikkan angka ini setiap update agar SW refresh
const CACHE_NAME = 'thp-arsip-v1';

// File shell yang di-cache untuk akses lebih cepat & offline-ready
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache shell aplikasi
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch(() => {}) // abaikan jika ada file gagal di-cache
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Aplikasi GAS (script.google.com) & API → SELALU network (jangan di-cache, data dinamis)
// - File shell statis → network-first, fallback ke cache saat offline
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya tangani GET
  if (req.method !== 'GET') return;

  // Jangan cache konten Google Apps Script / Google (selalu butuh data segar)
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    return; // biarkan browser handle langsung (network)
  }

  // Network-first untuk shell statis lokal
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Simpan salinan ke cache
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone).catch(() => {}));
        return res;
      })
      .catch(() => caches.match(req)) // offline → pakai cache
  );
});

// Dukung pesan skipWaiting dari halaman (untuk update instan)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
