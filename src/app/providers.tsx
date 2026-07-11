import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useSessionStore } from '@/stores/session'
import { useThemeStore } from '@/stores/theme'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const setSession = useSessionStore((s) => s.setSession)
  const theme = useThemeStore((s) => s.theme)

  // Bootstrap the current session, then keep the store in sync. This is an auth
  // listener (not data fetching), so useEffect is the right tool here.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))

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
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme={theme === 'coffee' ? 'light' : 'dark'} position="top-center" richColors />
    </QueryClientProvider>
  )
}
