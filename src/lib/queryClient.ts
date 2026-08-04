import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { APP_VERSION } from '@/lib/version'

/** How long a cached screen may be replayed offline before it is discarded. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

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
  },
})

const persister = createSyncStoragePersister({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  key: 'almanac-query-cache',
  throttleTime: 2000,
})

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
    // Mutations must NOT be persisted. React Query dehydrates paused ones by
    // default, but a restored mutation carries only its variables — the
    // function is gone, so it resumes straight into "No mutationFn found":
    // the tap is lost *and* the user is shown a failure.
    //
    // Offline writes are out of scope here, and measured rather than assumed:
    // a mutation paused while offline does not resume on reconnect in this
    // version — not on the onlineManager transition, and not on an explicit
    // `resumePausedMutations()`, which never settles. So an offline tap is
    // local only, which is what OfflineBanner tells the user. Making writes
    // survive needs `setMutationDefaults` with serialisable variables for
    // every write path plus persisted mutations; that is its own piece of work.
    shouldDehydrateMutation: () => false,
  },
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
