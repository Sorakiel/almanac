import { QueryClient } from '@tanstack/react-query'

/** App-wide React Query client — the single source of truth for server data. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
