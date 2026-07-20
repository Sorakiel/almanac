import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { lastNDateKeys, localDateKey } from '@/lib/date'
import { fetchFreezesSince, fetchHabits, fetchLogsSince } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import {
  dailyTarget,
  dueInDays,
  expectedCompletionsInWindow,
  isDueOn,
} from '@/features/habits/lib/frequency'
import { currentStreak } from '@/features/habits/lib/streak'
import { computeDayCells } from '@/features/habits/lib/schedule'
import type { Habit, HabitFreeze, HabitLog, HabitWithTodayLog } from '@/features/habits/types'

const WINDOW_DAYS = 7
/** Fetch window: long enough to resolve due-ness for the longest interval
 *  cadence the form allows (every 8 weeks = 56 days), plus a small buffer. */
const FETCH_DAYS = 64

function join(
  habits: Habit[],
  logs: HabitLog[],
  freezes: HabitFreeze[],
  windowKeys: string[],
  timezone: string,
): HabitWithTodayLog[] {
  // Index counts by habit + date for O(1) lookup.
  const counts = new Map<string, number>()
  for (const log of logs) counts.set(`${log.habit_id}:${log.date}`, log.count)
  const frozen = new Set<string>()
  for (const f of freezes) frozen.add(`${f.habit_id}:${f.date}`)
  const todayKey = windowKeys[windowKeys.length - 1]!

  return habits.map((habit) => {
    const target = dailyTarget(habit)
    const doneOn = (key: string): boolean => (counts.get(`${habit.id}:${key}`) ?? 0) >= target
    const frozenOn = (key: string): boolean => frozen.has(`${habit.id}:${key}`)

    const windowSlice = windowKeys.slice(-WINDOW_DAYS)
    const todayCount = counts.get(`${habit.id}:${todayKey}`) ?? 0
    const completedRecent = windowSlice.reduce((sum, key) => sum + (doneOn(key) ? 1 : 0), 0)
    // Rate is relative to what the cadence expects in the window, not raw days:
    // a 2×/week habit hits 100% at 2 completions, not 7. Only count days since
    // the habit was created, so a brand-new habit isn't dragged down by a full
    // window of "expected" days it never existed for.
    const createdKey = localDateKey(timezone, new Date(habit.created_at))

    // Sparkline holds the line across scheduled rest days (an "every 3 days"
    // gap isn't a dip) and only falls on a genuine missed due-day — so a habit
    // that's on cadence never reads as trending down.
    const cells = computeDayCells(
      habit,
      new Set(windowSlice.filter(doneOn)),
      new Set(windowSlice.filter(frozenOn)),
      windowSlice,
      todayKey,
      createdKey,
    )
    let held = 0
    const series: number[] = cells.map((cell) =>
      cell.status === 'done' ? (held = 1) : cell.status === 'missed' ? (held = 0) : held,
    )
    const expected = expectedCompletionsInWindow(
      habit,
      windowSlice.filter((k) => k >= createdKey),
    )

    // Whole days since the most recent completion (0 = today), for interval due-ness.
    let daysSinceLastDone: number | null = null
    for (let i = windowKeys.length - 1; i >= 0; i--) {
      if (doneOn(windowKeys[i]!)) {
        daysSinceLastDone = windowKeys.length - 1 - i
        break
      }
    }
    const dueIn = dueInDays(habit, daysSinceLastDone)

    const isComplete = todayCount >= target
    const dueToday = isDueOn(habit, todayKey, daysSinceLastDone)
    const streak = currentStreak(habit, doneOn, windowKeys, frozenOn)
    const frozenToday = frozenOn(todayKey)

    return {
      ...habit,
      todayCount,
      isComplete,
      series,
      completedRecent,
      windowDays: WINDOW_DAYS,
      rate: expected > 0 ? Math.min(completedRecent / expected, 1) : 0,
      dueInDays: dueIn,
      dueToday,
      streak,
      frozenToday,
      // A streak is "at risk" only while it's still losable today: due, unfinished,
      // not already protected by a freeze, and with a run already going (≥2 days,
      // so a fresh day-one habit isn't nagged).
      atRisk: dueToday && !isComplete && !frozenToday && streak >= 2,
    }
  })
}

interface UseHabitsResult {
  habits: HabitWithTodayLog[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** Active habits joined with today's completion and a 7-day history. */
export function useHabits(): UseHabitsResult {
  const { user } = useSession()
  const { dateKey, timezone } = useToday()
  const userId = user?.id ?? ''
  const enabled = Boolean(userId)
  const windowKeys = lastNDateKeys(dateKey, FETCH_DAYS)

  const habitsQuery = useQuery({
    queryKey: habitKeys.all(userId),
    queryFn: () => fetchHabits(userId),
    enabled,
  })

  const logsQuery = useQuery({
    queryKey: habitKeys.recentLogs(userId, dateKey),
    queryFn: () => fetchLogsSince(userId, windowKeys[0]!),
    enabled,
  })

  const freezesQuery = useQuery({
    queryKey: habitKeys.recentFreezes(userId, dateKey),
    queryFn: () => fetchFreezesSince(userId, windowKeys[0]!),
    enabled,
  })

  const habits =
    habitsQuery.data && logsQuery.data
      ? join(habitsQuery.data, logsQuery.data, freezesQuery.data ?? [], windowKeys, timezone)
      : []

  return {
    habits,
    isLoading: habitsQuery.isLoading || logsQuery.isLoading,
    isError: habitsQuery.isError || logsQuery.isError,
    refetch: () => {
      void habitsQuery.refetch()
      void logsQuery.refetch()
      void freezesQuery.refetch()
    },
  }
}
