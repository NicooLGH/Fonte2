/* ============================================================
   FONTE — Service worker
   ============================================================
   Une seule règle, et elle est volontairement prudente : on ne
   met en cache QUE les fichiers statiques compilés.

   Rien de ce qui vient du serveur applicatif n'est conservé. Les
   pages sont rendues à la demande et contiennent des données
   fraîches ; servir une version périmée ferait croire à des
   séances perdues, ou pousserait à écraser du récent avec de
   l'ancien.

   L'ancien carnet mettait en cache toute la coquille parce qu'il
   n'avait pas de serveur. Ici, ce serait un piège.
   ============================================================ */

const VERSION = 'fonte-next-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(['/icon-192.png', '/icon-512.png', '/manifest.json']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.map((k) => (k !== VERSION ? caches.delete(k) : null)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Seuls les fichiers compilés et les icônes passent par le cache.
  const statique =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'

  if (!statique) return

  e.respondWith(
    caches.match(e.request).then((cache) => {
      if (cache) return cache
      return fetch(e.request).then((rep) => {
        if (rep && rep.status === 200) {
          const copie = rep.clone()
          caches.open(VERSION).then((c) => c.put(e.request, copie))
        }
        return rep
      })
    })
  )
})

// Notification déclenchée depuis la page (fin de repos, etc.)
self.addEventListener('message', (e) => {
  const d = e.data || {}
  if (d.type === 'notif') {
    self.registration.showNotification(d.titre || 'FONTE', {
      body: d.corps || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: d.tag || 'fonte',
    })
  }
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((liste) => {
        for (const c of liste) if ('focus' in c) return c.focus()
        if (self.clients.openWindow) return self.clients.openWindow('/')
      })
  )
})
