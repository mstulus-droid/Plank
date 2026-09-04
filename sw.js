/* Service worker Plank.
   Tujuan: aplikasi tetap bisa dibuka tanpa internet setelah dipasang di HP.
   Halaman HTML diambil dari jaringan dulu (supaya versi baru langsung terbaca
   begitu deploy), gambar dan ikon dari cache dulu. Musik latar TIDAK di-cache
   di sini; ukurannya besar dan cache browser biasa sudah cukup.
   Naikkan VERSI setiap kali daftar berkas di bawah berubah. */
const VERSI = 'plank-2026-09-05';
const BERKAS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './1_high_plank.png',
  './2_low_plank.png',
  './3_side_plank_kanan.png',
  './4_side_plank_kiri.png',
  './5_reverse_table_top.png',
  './6_reverse_plank.png',
  './7_bear_pose.png',
  './8_boat_pose.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(BERKAS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((kunci) => Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.(opus|mp3)$/i.test(url.pathname)) return; // musik: langsung ke jaringan

  const halaman = req.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (halaman) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const salinan = res.clone();
          caches.open(VERSI).then((c) => c.put('./index.html', salinan));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const salinan = res.clone();
        caches.open(VERSI).then((c) => c.put(req, salinan));
      }
      return res;
    }))
  );
});
