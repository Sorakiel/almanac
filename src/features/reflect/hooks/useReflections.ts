import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchReflections } from '@/features/reflect/api/reflections.api'
import type { Reflection } from '@/features/reflect/types'

interface UseReflectionsResult {
  reflections: Reflection[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The signed-in user's reflections, newest day first (own-rows via RLS). */
export function useReflections(): UseReflectionsResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['reflections', userId],
    queryFn: () => fetchReflections(userId),
    enabled: Boolean(userId),
  })

  return {
    reflections: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
