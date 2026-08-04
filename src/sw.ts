/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  createHandlerBoundToURL,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

/* Almanac service worker — app shell caching plus push notifications.
 *
 * The two live in one file because a page may only have one worker at a scope,
 * and push shipped first. Everything below the precache block is the original
 * push worker, unchanged.
 *
 * Only the built app shell is cached. API responses are deliberately *not*
 * intercepted: React Query owns that cache and persists it to localStorage, so
 * a second, differently-invalidated copy in the worker could serve a habit list
 * the app believes it already updated. */

declare const self: ServiceWorkerGlobalScope & typeof globalThis

interface PushPayload {
  title?: string
  body?: string
  tag?: string
  url?: string
}

// Injected at build time by vite-plugin-pwa: every hashed asset in dist.
precacheAndRoute(self.__WB_MANIFEST)
// A deploy replaces every hashed chunk. Without this the old ones stay forever.
cleanupOutdatedCaches()

// The SPA has no server routes — any navigation resolves to the one index.html.
// Anything under /assets is a precached file already matched above, and the
// Supabase/PostHog origins are cross-origin so they never reach this route.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('install', () => {
  void self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  // A push with no payload still deserves a notification: on some platforms the
  // browser shows its own generic "site updated" message if we show nothing.
  let payload: PushPayload
  try {
    payload = event.data ? (event.data.json() as PushPayload) : {}
  } catch {
    payload = {}
  }

  const title = payload.title || 'Almanac'
  const options: NotificationOptions = {
    body: payload.body || 'Time to keep the line.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'almanac-reminder',
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data as { url?: string } | undefined
  const target = data?.url || '/'

  // Focus an open Almanac tab instead of stacking up new ones.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          void client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
