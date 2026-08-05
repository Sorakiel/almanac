import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { trackEvent } from '@/lib/analytics'
import { OFFLINE_MUTATION_KEYS, type ToggleHabitVariables } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { habitsWindowStart } from '@/features/habits/hooks/useHabits'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { emitActivity } from '@/features/social/api/social.api'
import { isStreakMilestone } from '@/features/social/lib/milestones'
import type { HabitLog, HabitWithTodayLog } from '@/features/habits/types'

interface ToggleArgs {
  habit: HabitWithTodayLog
}

type ToggleContext = { previous: HabitLog[] } | undefined

/**
 * One-tap completion. A tap increments the day's count (so multi-target habits
 * fill up); tapping a completed habit clears it. The recent-logs cache is
 * updated optimistically for instant feedback and rolled back on error.
 *
 * `mutationFn` and the post-write cache invalidation are NOT declared here —
 * they live once in `registerOfflineMutations` (src/lib/offlineMutations.ts)
 * and this mutation inherits them via `mutationKey`, because a tap made
 * offline resumes headlessly (no mounted component) and has to run the exact
 * same write. Redeclaring either here would just be a second implementation
 * that silently stops matching the first.
 */
export function useToggleHabit() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  // The optimistic patch has to land on the exact window the habit list reads.
  const logsKey = habitKeys.logsSince(userId, habitsWindowStart(dateKey))

  const mutation = useMutation<void, Error, ToggleHabitVariables, ToggleContext>({
    mutationKey: OFFLINE_MUTATION_KEYS.toggleHabit,
    onMutate: async ({ habit }: ToggleHabitVariables) => {
      await queryClient.cancelQueries({ queryKey: logsKey })
      const previous = queryClient.getQueryData<HabitLog[]>(logsKey) ?? []
      const nextCount = habit.isComplete ? 0 : habit.todayCount + 1

      // Replace today's row for this habit (or drop it when cleared).
      const others = previous.filter((log) => !(log.habit_id === habit.id && log.date === dateKey))
      const next: HabitLog[] =
        nextCount <= 0
          ? others
          : [
              ...others,
              {
                id: `optimistic-${habit.id}-${dateKey}`,
                user_id: userId,
                habit_id: habit.id,
                date: dateKey,
                count: nextCount,
                note: null,
                created_at: new Date().toISOString(),
              },
            ]

      queryClient.setQueryData<HabitLog[]>(logsKey, next)
      return { previous }
    },
    onSuccess: (_data, { habit }: ToggleHabitVariables) => {
      // When this tap completes the habit and pushes its streak to a milestone,
      // publish a privacy-safe feed event (a day count only — never the habit
      // name). Completing on a due day extends the run by one. Best-effort +
      // idempotent (deduped in the DB); a miss never affects the completion.
      const completing = !habit.isComplete && habit.todayCount + 1 >= dailyTarget(habit)
      const newStreak = habit.streak + 1
      // Only the closing tap counts — a habit with target 3 shouldn't read as
      // three completions, and clearing one isn't a completion at all.
      if (completing) trackEvent('habit_completed', { streak: newStreak })
      if (completing && isStreakMilestone(newStreak)) {
        void emitActivity({
          user_id: userId,
          kind: 'streak_reached',
          subject: habit.id,
          meta: { days: newStreak },
          event_date: dateKey,
        }).catch(() => undefined)
      }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(logsKey, context.previous)
    },
    // No onSettled here — the registered default already invalidates
    // habitKeys.logsRoot on settle (every log window, not just the one this
    // list reads; insights keeps a deeper one and used to sit stale after a
    // completion) and still runs because this call doesn't override it.
  })

  // Callers only ever hand over the habit — userId/date are this hook's own
  // state, not something a tap needs to know about. Injecting them here keeps
  // the mutation's persisted variables fully self-contained (no closures) for
  // when a resume runs with no component mounted.
  const mutate = (
    args: ToggleArgs,
    options?: MutateOptions<void, Error, ToggleHabitVariables, ToggleContext>,
  ) => mutation.mutate({ ...args, userId, date: dateKey }, options)
  const mutateAsync = (args: ToggleArgs) => mutation.mutateAsync({ ...args, userId, date: dateKey })

  return { ...mutation, mutate, mutateAsync }
}
