/* Almanac service worker — push notifications only.
 *
 * Deliberately no fetch handler and no caching. Offline is a separate piece of
 * work with its own failure modes (stale chunks after a deploy, most of all),
 * and a worker that only listens for push cannot break page loads. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  // A push with no payload still deserves a notification: on some platforms the
  // browser shows its own generic "site updated" message if we show nothing.
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title = payload.title || 'Almanac'
  const options = {
    body: payload.body || 'Time to keep the line.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'almanac-reminder',
    renotify: false,
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'

  // Focus an open Almanac tab instead of stacking up new ones.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
