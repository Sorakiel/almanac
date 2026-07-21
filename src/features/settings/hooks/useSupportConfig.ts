import { useQuery } from '@tanstack/react-query'
import { fetchSupportConfig, type SupportConfig } from '@/features/settings/api/support.api'
import { useSession } from '@/hooks/useSession'

interface UseSupportConfigResult {
  config: SupportConfig | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * The "Support Almanac" config for the current user: the master flag plus the
 * enabled donation methods. Cached generously — it's global, owner-edited data
 * that changes rarely, so a stale window avoids refetching on every settings
 * open. Feeds both the Settings row (gate) and the sheet.
 */
export function useSupportConfig(): UseSupportConfigResult {
  const { status } = useSession()

  const query = useQuery({
    queryKey: ['support-config'],
    queryFn: fetchSupportConfig,
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  })

  return { config: query.data, isLoading: query.isLoading, isError: query.isError }
}
