import { queryOptions } from '@tanstack/react-query'
import { fetchFreezesSince, fetchHabits, fetchLogsSince } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'

/**
 * Key + fetcher pairs for the habit data several screens read. Keeping them
 * together means two screens asking for the same window share one cache entry
 * and one invalidation — see `habitKeys` for why the window is in the key.
 */
export const habitQueries = {
  all: (userId: string) =>
    queryOptions({
      queryKey: habitKeys.all(userId),
      queryFn: () => fetchHabits(userId),
      enabled: Boolean(userId),
    }),
  logsSince: (userId: string, from: string) =>
    queryOptions({
      queryKey: habitKeys.logsSince(userId, from),
      queryFn: () => fetchLogsSince(userId, from),
      enabled: Boolean(userId),
    }),
  freezesSince: (userId: string, from: string) =>
    queryOptions({
      queryKey: habitKeys.freezesSince(userId, from),
      queryFn: () => fetchFreezesSince(userId, from),
      enabled: Boolean(userId),
    }),
}
