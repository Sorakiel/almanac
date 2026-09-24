import { useQuery } from '@tanstack/react-query'
import { habitQueries } from '@/features/habits/hooks/habitQueries'
import { dateKeysBetween } from '@/features/insights/hooks/useYearActivity'
import { buildYearActivity } from '@/features/insights/lib/yearActivity'
import {
  almanacStartKey,
  buildAlmanacGrid,
  countActiveDays,
  type ActiveDays,
  type AlmanacCell,
} from '@/features/profile/lib/almanacGrid'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'

interface UseProfileActivityResult {
  grid: AlmanacCell[][]
  activeDays: ActiveDays
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Half a year of days for the profile: the "Ваш альманах" grid and the avatar
 * ring's active-days count.
 *
 * Bounded to the grid's 26 weeks, and scored with the same schedule-aware
 * `buildYearActivity` as Insights, so a rest day never reads as a miss. The
 * window uses the shared `logsSince` / `freezesSince` keys, which every habit
 * write already invalidates — a check-off on Today reaches this grid too.
 */
export function useProfileActivity(joinedKey: string | null): UseProfileActivityResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const from = almanacStartKey(dateKey)

  const habitsQuery = useQuery(habitQueries.all(userId))
  const logsQuery = useQuery(habitQueries.logsSince(userId, from))
  const freezesQuery = useQuery(habitQueries.freezesSince(userId, from))

  const completed = new Map<string, Set<string>>()
  const frozen = new Map<string, Set<string>>()
  for (const log of logsQuery.data ?? []) {
    const set = completed.get(log.habit_id) ?? new Set<string>()
    set.add(log.date)
    completed.set(log.habit_id, set)
  }
  for (const freeze of freezesQuery.data ?? []) {
    const set = frozen.get(freeze.habit_id) ?? new Set<string>()
    set.add(freeze.date)
    frozen.set(freeze.habit_id, set)
  }

  const scores = buildYearActivity(
    habitsQuery.data ?? [],
    completed,
    frozen,
    dateKeysBetween(from, dateKey),
    dateKey,
  )

  return {
    grid: buildAlmanacGrid(scores, dateKey),
    activeDays: countActiveDays(scores, joinedKey, dateKey),
    isLoading: habitsQuery.isLoading || logsQuery.isLoading || freezesQuery.isLoading,
    isError: habitsQuery.isError || logsQuery.isError || freezesQuery.isError,
    refetch: () => {
      void habitsQuery.refetch()
      void logsQuery.refetch()
      void freezesQuery.refetch()
    },
  }
}
