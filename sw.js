// ── Service worker du Bureau du Prof ──────────────────────────────────────
// Stratégie « réseau d'abord » : on charge toujours la version en ligne
// (vos mises à jour apparaissent tout de suite), et on garde une copie de
// chaque fichier du site pour pouvoir rouvrir l'application sans internet.
//
// Pour vider l'ancien cache après une grosse mise à jour : changer VERSION.
const VERSION = 'bdp-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    // Uniquement les lectures (GET) des fichiers du site lui-même :
    // YouTube, Google, Web3Forms, statistiques… passent sans être touchés.
    if (req.method !== 'GET') return;
    if (new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then(res => {
                if (res && res.ok && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(VERSION).then(c => c.put(req, copy));
                }
                return res;
            })
            .catch(() =>
                caches.match(req, { ignoreSearch: req.mode === 'navigate' })
                    .then(hit => hit || (req.mode === 'navigate' ? caches.match('/') : undefined))
                    .then(hit => hit || Response.error())
            )
    );
});
