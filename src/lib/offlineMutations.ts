import type { QueryClient } from '@tanstack/react-query'
import {
  addFreeze,
  archiveHabit,
  createHabit,
  createSubtask,
  deleteSubtask,
  removeFreeze,
  setHabitCount,
  setSubtaskCompletedDates,
  updateHabit,
  updateHabitOrder,
} from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { HabitWithTodayLog } from '@/features/habits/types'
import type { HabitFormInput } from '@/features/habits/hooks/useHabitMutations'
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
  toggleFreeze: [OFFLINE_MUTATION_ROOT, 'toggleFreeze'] as const,
  toggleSubtask: [OFFLINE_MUTATION_ROOT, 'toggleSubtask'] as const,
  createHabit: [OFFLINE_MUTATION_ROOT, 'createHabit'] as const,
  updateHabit: [OFFLINE_MUTATION_ROOT, 'updateHabit'] as const,
  archiveHabit: [OFFLINE_MUTATION_ROOT, 'archiveHabit'] as const,
  reorderHabits: [OFFLINE_MUTATION_ROOT, 'reorderHabits'] as const,
  createSubtask: [OFFLINE_MUTATION_ROOT, 'createSubtask'] as const,
  deleteSubtask: [OFFLINE_MUTATION_ROOT, 'deleteSubtask'] as const,
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

export interface ToggleFreezeVariables {
  userId: string
  habitId: string
  date: string
  freeze: boolean
}

export interface ToggleSubtaskVariables {
  habitId: string
  subtaskId: string
  dates: string[]
}

export interface CreateHabitVariables {
  input: HabitFormInput
  userId: string
}

export interface UpdateHabitVariables {
  id: string
  input: HabitFormInput
  userId: string
}

export interface ArchiveHabitVariables {
  id: string
  userId: string
}

export interface ReorderHabitsVariables {
  ordered: { id: string; sort_order: number }[]
  userId: string
}

export interface CreateSubtaskVariables {
  userId: string
  habitId: string
  title: string
  sortOrder: number
}

export interface DeleteSubtaskVariables {
  id: string
  habitId: string
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

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.toggleFreeze, {
    mutationFn: ({ userId, habitId, date, freeze }: ToggleFreezeVariables) =>
      freeze ? addFreeze(userId, habitId, date) : removeFreeze(habitId, date),
    onSettled: (_data, _error, { userId, habitId }: ToggleFreezeVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.freezesRoot(userId) })
      void client.invalidateQueries({ queryKey: ['habitFreezes', habitId] })
    },
  })

  // Only the checklist write itself is guaranteed here — the follow-up sync
  // that rolls a fully-checked list into the habit's own count
  // (syncHabitCompletion in useHabitSubtasks) stays live-only. It still runs
  // normally for a resume within the same session (the live mutation object
  // survives); it just won't run for a mutation resumed after a cold start,
  // which is an acceptable gap: the checklist state itself is never lost,
  // only the derived habit-count mirror, which the next toggle re-syncs.
  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.toggleSubtask, {
    mutationFn: ({ subtaskId, dates }: ToggleSubtaskVariables) =>
      setSubtaskCompletedDates(subtaskId, dates),
    onSettled: (_data, _error, { habitId }: ToggleSubtaskVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.subtasks(habitId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.createHabit, {
    mutationFn: ({ input, userId }: CreateHabitVariables) =>
      createHabit({ ...input, user_id: userId }),
    onSettled: (_data, _error, { userId }: CreateHabitVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.all(userId) })
      void client.invalidateQueries({ queryKey: ['habit'] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.updateHabit, {
    mutationFn: ({ id, input }: UpdateHabitVariables) => updateHabit(id, input),
    onSettled: (_data, _error, { userId }: UpdateHabitVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.all(userId) })
      void client.invalidateQueries({ queryKey: ['habit'] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.archiveHabit, {
    mutationFn: ({ id }: ArchiveHabitVariables) => archiveHabit(id),
    onSettled: (_data, _error, { userId }: ArchiveHabitVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.all(userId) })
      void client.invalidateQueries({ queryKey: ['habit'] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.reorderHabits, {
    mutationFn: ({ ordered }: ReorderHabitsVariables) => updateHabitOrder(ordered),
    onSettled: (_data, _error, { userId }: ReorderHabitsVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.all(userId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.createSubtask, {
    mutationFn: ({ userId, habitId, title, sortOrder }: CreateSubtaskVariables) =>
      createSubtask(userId, habitId, title, sortOrder),
    onSettled: (_data, _error, { habitId }: CreateSubtaskVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.subtasks(habitId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.deleteSubtask, {
    mutationFn: ({ id }: DeleteSubtaskVariables) => deleteSubtask(id),
    onSettled: (_data, _error, { habitId }: DeleteSubtaskVariables) => {
      void client.invalidateQueries({ queryKey: habitKeys.subtasks(habitId) })
    },
  })
}
