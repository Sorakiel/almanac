import { useSyncExternalStore } from 'react'

/**
 * Subscribe to the browser's network connectivity. Backs the StatusLine "live
 * dot" so it reflects real reachability instead of a hardcoded label. Reads
 * synchronously (defaults to `true` on the server) to avoid a first-paint flip.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('online', onChange)
      window.addEventListener('offline', onChange)
      return () => {
        window.removeEventListener('online', onChange)
        window.removeEventListener('offline', onChange)
      }
    },
    () => navigator.onLine,
    () => true,
  )
}
