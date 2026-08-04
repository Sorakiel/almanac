import { isCapacitor, isTauri } from '@/lib/notify'

/**
 * Register the app-shell worker.
 *
 * Registration is unconditional now that the worker caches the shell — before
 * RET-3 it only ran for people who had turned reminders on. `push.ts` reuses
 * whatever registration this produces rather than making a second one.
 *
 * Not in the native shells: Tauri serves from a custom protocol and Capacitor
 * from the local filesystem, so a worker there caches a copy of files that are
 * already on disk, and its update cycle fights the shells' own updaters.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return // no worker in dev — vite serves modules directly
  if (isTauri() || isCapacitor()) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // A failed registration must never break the app: the site works online
      // without a worker, which is exactly what it did before this change.
    })
  })
}
