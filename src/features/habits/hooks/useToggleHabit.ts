import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { trackEvent } from '@/lib/analytics'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { habitsWindowStart } from '@/features/habits/hooks/useHabits'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { emitActivity } from '@/features/social/api/social.api'
import { isStreakMilestone } from '@/features/social/lib/milestones'
import type { HabitLog, HabitWithTodayLog } from '@/features/habits/types'

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

  // Callers only ever hand over the habit — userId/date are this hook's own
  // state, not something a tap needs to know about.
  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleHabit,
    ({ habit }: { habit: HabitWithTodayLog }) => ({ habit, userId, date: dateKey }),
    {
      onMutate: ({ habit }) =>
        patchQueryData<HabitLog[]>(queryClient, logsKey, (previous = []) => {
          const nextCount = habit.isComplete ? 0 : habit.todayCount + 1
          // Replace today's row for this habit (or drop it when cleared).
          const others = previous.filter(
            (log) => !(log.habit_id === habit.id && log.date === dateKey),
          )
          if (nextCount <= 0) return others
          return [
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
        }),
      onSuccess: (_data, { habit }) => {
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
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, logsKey, context),
      // No onSettled here — the registered default already invalidates
      // habitKeys.logsRoot on settle (every log window, not just the one this
      // list reads; insights keeps a deeper one and used to sit stale after a
      // completion) and still runs because this call doesn't override it.
    },
  )
}
