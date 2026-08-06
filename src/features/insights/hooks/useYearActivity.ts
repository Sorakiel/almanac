import { useQuery } from '@tanstack/react-query'
import { fetchFreezesSince, fetchHabits, fetchLogsSince } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { buildYearActivity, type YearDay } from '@/features/insights/lib/yearActivity'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'

interface UseYearActivityResult {
  days: YearDay[]
  isLoading: boolean
}

/** First of January for the year `dateKey` falls in. */
export function yearStartKey(dateKey: string): string {
  return `${dateKey.slice(0, 4)}-01-01`
}

/** Every date key from `from` through `to`, inclusive. */
export function dateKeysBetween(from: string, to: string): string[] {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  const keys: string[] = []
  for (let t = start; t <= end; t += 86_400_000) {
    keys.push(new Date(t).toISOString().slice(0, 10))
  }
  return keys
}

/**
 * The calendar year so far, scored day by day.
 *
 * Bounded by date like every other query here — a year of one person's logs is
 * small, and the window never grows past 366 rows per habit. The habit list
 * shares `habitKeys.all`, so this doesn't refetch a list the shell already
 * holds.
 */
export function useYearActivity(): UseYearActivityResult {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const enabled = Boolean(userId)
  const from = yearStartKey(dateKey)

  const habitsQuery = useQuery({
    queryKey: habitKeys.all(userId),
    queryFn: () => fetchHabits(userId),
    enabled,
  })

  // Deliberately the shared `logsSince`/`freezesSince` namespaces, keyed by the
  // window start: a private key would be missed by every write's invalidation,
  // which is exactly how the insights copy went stale before FND-7.
  const logsQuery = useQuery({
    queryKey: habitKeys.logsSince(userId, from),
    queryFn: () => fetchLogsSince(userId, from),
    enabled,
  })

  const freezesQuery = useQuery({
    queryKey: habitKeys.freezesSince(userId, from),
    queryFn: () => fetchFreezesSince(userId, from),
    enabled,
  })

  const habits = habitsQuery.data ?? []
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

  return {
    days: buildYearActivity(habits, completed, frozen, dateKeysBetween(from, dateKey), dateKey),
    isLoading: habitsQuery.isLoading || logsQuery.isLoading || freezesQuery.isLoading,
  }
}
