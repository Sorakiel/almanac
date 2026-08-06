import { useEffect, type ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { Toaster } from 'sonner'
import { identifyUser, resetAnalytics } from '@/lib/analytics'
import { checkForAndroidUpdate } from '@/lib/androidUpdater'
import { initDeepLinks } from '@/lib/deepLink'
import { checkForDesktopUpdate } from '@/lib/desktopUpdater'
import { applyRunInBackground } from '@/lib/desktop'
import { clearQueryCache, persistOptions, queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useDaylight } from '@/hooks/useDaylight'
import { useDesktopStore } from '@/stores/desktop'
import { useSessionStore } from '@/stores/session'
import { useThemeStore } from '@/stores/theme'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const setSession = useSessionStore((s) => s.setSession)
  const theme = useThemeStore((s) => s.theme)

  // The canvas glow tracks the local clock — see `lib/daylight.ts`.
  useDaylight()

  // Native auto-update on launch; both are no-ops in the browser build.
  useEffect(() => {
    void checkForDesktopUpdate()
    void checkForAndroidUpdate()
    void initDeepLinks()
    // Push the saved "run in background" choice into the native shell (tray +
    // autostart) so it matches the toggle after a restart.
    void applyRunInBackground(useDesktopStore.getState().runInBackground)
  }, [])

  // Bootstrap the current session, then keep the store in sync. This is an auth
  // listener (not data fetching), so useEffect is the right tool here.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      // The persisted query cache outlives the session, so it has to be dropped
      // explicitly — otherwise the next person on this device sees the previous
      // person's data before their own arrives.
      if (event === 'SIGNED_OUT') void clearQueryCache()
      // Identify by Supabase user id only. Resetting on sign-out matters on a
      // shared device: without it the next person inherits the previous
      // person's distinct id.
      if (session?.user.id !== undefined) identifyUser(session.user.id)
      else resetAnalytics()
    })

    // Resolve the initial session. If it rejects (e.g. an invalid/expired
    // refresh token 400s, or the network is unreachable), fall back to
    // anonymous so the app shows the auth screen instead of spinning forever.
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))

    // Safety net: never stay on the loading spinner indefinitely.
    const timeout = setTimeout(() => {
      if (useSessionStore.getState().status === 'loading') setSession(null)
    }, 8000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [setSession])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      // Restored data is shown immediately but never trusted: the snapshot on
      // disk is throttled, so a reload seconds after a change would otherwise
      // render the pre-change state and — being inside `staleTime` — refuse to
      // refetch it. Invalidating on restore makes this stale-while-revalidate.
      // Offline the refetch simply fails and the cached screen stays put.
      onSuccess={() => {
        queryClient.invalidateQueries()
        // Covers a mutation that paused before this session started (app
        // closed offline, reopened already online) — the 'online' listener
        // in queryClient.ts only fires on a transition, not on load.
        void queryClient.resumePausedMutations()
      }}
    >
      {children}
      <Toaster theme={theme === 'coffee' ? 'light' : 'dark'} position="top-center" richColors />
    </PersistQueryClientProvider>
  )
}
