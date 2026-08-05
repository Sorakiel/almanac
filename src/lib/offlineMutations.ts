import type { QueryClient } from '@tanstack/react-query'
import { setHabitCount } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { updateSet } from '@/features/workouts/api/session.api'
import type { SetLog } from '@/features/workouts/types'

/**
 * Every offline-durable mutation key is namespaced under `'offline'` — that
 * prefix is also how `queryClient.ts` decides what to persist. A write path
 * not registered here must never be dehydrated: a resumed mutation with no
 * registered default fails on sight with "No mutationFn found", which loses
 * the tap *and* shows an error. See `OFFLINE_MUTATION_ROOT`.
 */
export const OFFLINE_MUTATION_ROOT = 'offline'

export const OFFLINE_MUTATION_KEYS = {
  toggleHabit: [OFFLINE_MUTATION_ROOT, 'toggleHabit'] as const,
  editSet: [OFFLINE_MUTATION_ROOT, 'editSet'] as const,
}

export interface ToggleHabitVariables {
  habit: HabitWithTodayLog
  userId: string
  date: string
}

export interface EditSetVariables {
  workoutId: string
  id: string
  patch: Partial<Pick<SetLog, 'reps' | 'weight' | 'done' | 'set_number' | 'rest_seconds'>>
}

/**
 * Mutation defaults for every write that must survive a tap made offline.
 *
 * Registered once, synchronously, before the persisted cache restores (see
 * `queryClient.ts`) — a resumed mutation is rebuilt from just its
 * `mutationKey` and dehydrated `state`, so `mutationFn` has to come from here
 * rather than from a live component that may not exist yet when the app cold
 * starts back online. `onSettled` lives here for the same reason: it must run
 * whether or not a component observes the mutation. A live `useMutation` call
 * that also sets `mutationKey: OFFLINE_MUTATION_KEYS.x` inherits both — do not
 * redeclare `mutationFn`/`onSettled` at the call site, or the two
 * implementations will drift.
 */
export function registerOfflineMutations(client: QueryClient): void {
  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.toggleHabit, {
    mutationFn: ({ habit, userId, date }: ToggleHabitVariables) => {
      const nextCount = habit.isComplete ? 0 : habit.todayCount + 1
      return setHabitCount({ userId, habitId: habit.id, date, count: nextCount })
    },
    onSettled: (_data, _error, { userId }: ToggleHabitVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.logsRoot(userId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.editSet, {
    mutationFn: ({ id, patch }: EditSetVariables) => updateSet(id, patch),
    onSettled: (_data, _error, { workoutId }: EditSetVariables) => {
      void client.invalidateQueries({ queryKey: ['workoutSession', workoutId] })
    },
  })
}
