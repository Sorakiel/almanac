import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchProfiles } from '@/features/social/api/social.api'
import { socialKeys } from '@/features/social/hooks/queryKeys'
import type { FriendProfile } from '@/features/social/types'

interface UseUserSearchResult {
  results: FriendProfile[]
  isSearching: boolean
}

const DEBOUNCE_MS = 300

/** Debounced people-search by display name (server requires ≥2 characters). */
export function useUserSearch(query: string): UseUserSearchResult {
  const [debounced, setDebounced] = useState(query)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [query])

  const trimmed = debounced.trim()
  const searchQuery = useQuery({
    queryKey: socialKeys.search(trimmed),
    queryFn: () => searchProfiles(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 30,
  })

  return {
    results: searchQuery.data ?? [],
    isSearching: searchQuery.isFetching,
  }
}
