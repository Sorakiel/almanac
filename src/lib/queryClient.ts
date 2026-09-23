import { QueryClient, dehydrate, onlineManager } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type {
  PersistedClient,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client'
import { retryNetworkErrors, syncOnlineStateFromBrowser } from '@/lib/network'
import { OFFLINE_MUTATION_ROOT, registerOfflineMutations } from '@/lib/offlineMutations'
import { APP_VERSION } from '@/lib/version'

/** How long a cached screen may be replayed offline before it is discarded. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const CACHE_KEY = 'almanac-query-cache'

// Before anything can run a mutation — including the paused ones the
// persisted cache is about to restore.
syncOnlineStateFromBrowser()

/** App-wide React Query client — the single source of truth for server data. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      // Without this, a restored query is garbage-collected five minutes after
      // it goes unused and an offline cold start has nothing left to show.
      gcTime: MAX_AGE_MS,
    },
    mutations: {
      // Rides out a flaky connection; a real offline spell pauses the write
      // instead (and survives a reload), so this is not the offline path.
      retry: retryNetworkErrors,
    },
  },
})

// Must run before the persisted cache restores below — a resumed mutation is
// rebuilt from just its mutationKey and dehydrated state, so mutationFn has
// to already be registered by the time hydrate() runs.
registerOfflineMutations(queryClient)

const persister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: CACHE_KEY,
  throttleTime: 2000,
})

// A paused mutation does not continue on its own when the browser comes back
// online (see the note on shouldDehydrateMutation below) — it needs this
// explicit nudge. The equivalent nudge right after the persisted-cache
// restore lives in providers.tsx, for a mutation that was already paused
// *before* this app session started.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // This listener is registered before onlineManager's own, so without
    // flipping the flag here resumePausedMutations() would still see
    // "offline" and do nothing.
    onlineManager.setOnline(true)
    void queryClient.resumePausedMutations()
  })
}

/**
 * Restore the last-seen data on load so the app opens to real content offline
 * instead of to empty states.
 *
 * `buster` is the app version: a deploy that changes a query's shape must not
 * hydrate new code with the old shape. The Supabase session is not React Query
 * state and is not persisted here — a cached "signed in" would outlive the
 * real token.
 */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: MAX_AGE_MS,
  buster: APP_VERSION,
  dehydrateOptions: {
    // Only settled data is worth replaying: a pending or errored query restored
    // as-is renders a spinner or an error that never resolves.
    shouldDehydrateQuery: (query) => query.state.status === 'success',
    // Persist a paused mutation only if it is one we registered a default for
    // in offlineMutations.ts (mutationKey namespaced under 'offline'). A
    // restored mutation carries only its variables — the function is gone —
    // so anything else resumes straight into "No mutationFn found": the tap
    // is lost *and* the user is shown a failure. Migrating a write path to
    // survive offline means adding it to offlineMutations.ts first.
    //
    // The resume mechanism itself was measured, not assumed: a live paused
    // mutation does NOT continue on its own from the onlineManager 'online'
    // transition (confirmed broken in 5.101.4). It does resume correctly —
    // both live and after a dehydrate/hydrate round trip — from an explicit
    // `queryClient.resumePausedMutations()` call, which is wired to the
    // browser's 'online' event and to the persisted-cache restore in
    // providers.tsx.
    shouldDehydrateMutation: (mutation) =>
      mutation.state.isPaused && mutation.options.mutationKey?.[0] === OFFLINE_MUTATION_ROOT,
  },
}

/**
 * Write the cache to disk now, bypassing the persister's 2 s throttle.
 *
 * The throttle is trailing: a tap made offline and followed by closing or
 * reloading the app within two seconds never reached storage, so the paused
 * write was simply gone. `pagehide` / hidden visibility is the last moment a
 * synchronous write is guaranteed to land. Same format the persister writes.
 */
function flushPersistedCache(): void {
  const persisted: PersistedClient = {
    buster: APP_VERSION,
    timestamp: Date.now(),
    clientState: dehydrate(queryClient, persistOptions.dehydrateOptions),
  }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(persisted))
  } catch {
    // Quota or private mode: the throttled persister still runs and trims
    // the cache on its own failure path, so there is nothing to add here.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPersistedCache)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPersistedCache()
  })
}

/**
 * Drop every cached row, in memory and on disk.
 *
 * Called on sign-out. Without it the cache outlives the session, and on a
 * shared device the next person to sign in would see the previous person's
 * habits render for a moment before their own data arrived — RLS protects the
 * database, not a copy already sitting in localStorage.
 */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear()
  await persister.removeClient()
}
