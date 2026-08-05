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
import { createWorkout, deleteWorkout, updateWorkout } from '@/features/workouts/api/workouts.api'
import type { WorkoutFormInput } from '@/features/workouts/hooks/useWorkoutMutations'
import type { SetLog } from '@/features/workouts/types'
import {
  createReflection,
  deleteReflection,
  updateReflection,
} from '@/features/reflect/api/reflections.api'
import {
  createBook,
  deleteBook,
  updateBook,
  type BookPatch,
} from '@/features/reading/api/books.api'
import { createBookNote, deleteBookNote } from '@/features/reading/api/notes.api'
import { logBookRatingEvent } from '@/features/reading/api/ratings.api'
import { createReadingSession } from '@/features/reading/api/sessions.api'
import { statusForProgress } from '@/features/reading/lib/progress'
import {
  acceptFriendRequest,
  emitActivity,
  removeFriendship,
  sendFriendRequest,
} from '@/features/social/api/social.api'
import { socialKeys } from '@/features/social/hooks/queryKeys'
import type { Book, BookInsert } from '@/features/reading/types'
import { submitFeedback } from '@/features/modules/api/feedback.api'
import { updateOwnProfile } from '@/features/settings/api/profiles.api'
import type { Database } from '@/types/database.generated'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

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
  createWorkout: [OFFLINE_MUTATION_ROOT, 'createWorkout'] as const,
  updateWorkout: [OFFLINE_MUTATION_ROOT, 'updateWorkout'] as const,
  deleteWorkout: [OFFLINE_MUTATION_ROOT, 'deleteWorkout'] as const,
  toggleWorkoutComplete: [OFFLINE_MUTATION_ROOT, 'toggleWorkoutComplete'] as const,
  saveReflection: [OFFLINE_MUTATION_ROOT, 'saveReflection'] as const,
  deleteReflection: [OFFLINE_MUTATION_ROOT, 'deleteReflection'] as const,
  logReadingProgress: [OFFLINE_MUTATION_ROOT, 'logReadingProgress'] as const,
  rateBook: [OFFLINE_MUTATION_ROOT, 'rateBook'] as const,
  createBook: [OFFLINE_MUTATION_ROOT, 'createBook'] as const,
  updateBook: [OFFLINE_MUTATION_ROOT, 'updateBook'] as const,
  deleteBook: [OFFLINE_MUTATION_ROOT, 'deleteBook'] as const,
  createBookNote: [OFFLINE_MUTATION_ROOT, 'createBookNote'] as const,
  deleteBookNote: [OFFLINE_MUTATION_ROOT, 'deleteBookNote'] as const,
  sendFriendRequest: [OFFLINE_MUTATION_ROOT, 'sendFriendRequest'] as const,
  acceptFriendRequest: [OFFLINE_MUTATION_ROOT, 'acceptFriendRequest'] as const,
  removeFriendship: [OFFLINE_MUTATION_ROOT, 'removeFriendship'] as const,
  updateProfile: [OFFLINE_MUTATION_ROOT, 'updateProfile'] as const,
  sendFeedback: [OFFLINE_MUTATION_ROOT, 'sendFeedback'] as const,
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

export interface CreateWorkoutVariables {
  input: WorkoutFormInput
  userId: string
}

export interface UpdateWorkoutVariables {
  id: string
  input: WorkoutFormInput
  userId: string
}

export interface DeleteWorkoutVariables {
  id: string
  userId: string
}

export interface ToggleWorkoutCompleteVariables {
  id: string
  userId: string
  done: boolean
}

export interface SaveReflectionVariables {
  id: string | null
  date: string
  body: string
  quoteId: string | null
  mood: number | null
  energy: number | null
  dayRating: number | null
  userId: string
}

export interface DeleteReflectionVariables {
  id: string
  userId: string
}

export interface LogReadingProgressVariables {
  book: Book
  nextUnit: number
  minutes: number
  userId: string
  dateKey: string
}

export interface RateBookVariables {
  book: Book
  rating: number | null
  userId: string
}

export interface CreateBookVariables {
  input: Omit<BookInsert, 'user_id'>
  userId: string
}

export interface UpdateBookVariables {
  id: string
  patch: BookPatch
  userId: string
}

export interface DeleteBookVariables {
  id: string
  userId: string
}

export interface CreateBookNoteVariables {
  userId: string
  bookId: string
  body: string
  page: number | null
}

export interface DeleteBookNoteVariables {
  id: string
  bookId: string
}

export interface SendFriendRequestVariables {
  requesterId: string
  addresseeId: string
}

export interface AcceptFriendRequestVariables {
  friendshipId: string
  userId: string
}

export interface RemoveFriendshipVariables {
  friendshipId: string
  userId: string
}

export interface UpdateProfileVariables {
  userId: string
  patch: ProfileUpdate
}

export interface SendFeedbackVariables {
  userId: string
  body: string
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

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.createWorkout, {
    mutationFn: ({ input, userId }: CreateWorkoutVariables) =>
      createWorkout({ ...input, user_id: userId }),
    onSettled: (_data, _error, { userId }: CreateWorkoutVariables) => {
      void client.invalidateQueries({ queryKey: ['workouts', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.updateWorkout, {
    mutationFn: ({ id, input }: UpdateWorkoutVariables) => updateWorkout(id, input),
    onSettled: (_data, _error, { userId }: UpdateWorkoutVariables) => {
      void client.invalidateQueries({ queryKey: ['workouts', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.deleteWorkout, {
    mutationFn: ({ id }: DeleteWorkoutVariables) => deleteWorkout(id),
    onSettled: (_data, _error, { userId }: DeleteWorkoutVariables) => {
      void client.invalidateQueries({ queryKey: ['workouts', userId] })
    },
  })

  // Shared by useWorkoutMutations' toggleComplete (list view) and
  // useSessionMutations' setCompleted (in-session finish button) — same
  // underlying write, two call sites.
  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.toggleWorkoutComplete, {
    mutationFn: ({ id, done }: ToggleWorkoutCompleteVariables) =>
      updateWorkout(id, { completed_at: done ? new Date().toISOString() : null }),
    onSettled: (_data, _error, { id, userId }: ToggleWorkoutCompleteVariables) => {
      void client.invalidateQueries({ queryKey: ['workout', id] })
      void client.invalidateQueries({ queryKey: ['workouts', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.saveReflection, {
    mutationFn: ({
      id,
      date,
      body,
      quoteId,
      mood,
      energy,
      dayRating,
      userId,
    }: SaveReflectionVariables) =>
      id
        ? updateReflection(id, { body, mood, energy, day_rating: dayRating })
        : createReflection({
            user_id: userId,
            date,
            body,
            quote_id: quoteId,
            mood,
            energy,
            day_rating: dayRating,
          }),
    onSettled: (_data, _error, { userId }: SaveReflectionVariables) => {
      void client.invalidateQueries({ queryKey: ['reflections', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.deleteReflection, {
    mutationFn: ({ id }: DeleteReflectionVariables) => deleteReflection(id),
    onSettled: (_data, _error, { userId }: DeleteReflectionVariables) => {
      void client.invalidateQueries({ queryKey: ['reflections', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.logReadingProgress, {
    mutationFn: async ({
      book,
      nextUnit,
      minutes,
      userId,
      dateKey,
    }: LogReadingProgressVariables) => {
      const capped =
        book.total_units && book.total_units > 0
          ? Math.min(nextUnit, book.total_units)
          : Math.max(0, nextUnit)
      const delta = Math.max(0, capped - book.current_unit)
      const status = statusForProgress(book, capped)

      const patch: BookPatch = { current_unit: capped, status }
      if (status === 'reading' && !book.started_on) patch.started_on = dateKey
      if (status === 'finished' && !book.finished_on) patch.finished_on = dateKey

      await updateBook(book.id, patch)
      if (delta > 0 || minutes > 0) {
        await createReadingSession({
          user_id: userId,
          book_id: book.id,
          minutes,
          units_read: delta,
          date: dateKey,
        })
      }
      if (delta > 0) {
        void emitActivity({
          user_id: userId,
          kind: 'reading_progress',
          subject: book.id,
          meta: { units: delta, unit: book.progress_mode },
          event_date: dateKey,
        }).catch(() => undefined)
      }
    },
    onSettled: (_data, _error, { book, userId }: LogReadingProgressVariables) => {
      void client.invalidateQueries({ queryKey: ['books', userId] })
      void client.invalidateQueries({ queryKey: ['book', book.id] })
      void client.invalidateQueries({ queryKey: ['readingSessions', book.id] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.rateBook, {
    mutationFn: async ({ book, rating, userId }: RateBookVariables) => {
      await updateBook(book.id, { rating })
      if (rating !== null) {
        await logBookRatingEvent({
          user_id: userId,
          book_id: book.id,
          rating,
          current_unit: book.current_unit,
        })
      }
    },
    onSettled: (_data, _error, { book, userId }: RateBookVariables) => {
      void client.invalidateQueries({ queryKey: ['books', userId] })
      void client.invalidateQueries({ queryKey: ['book', book.id] })
      void client.invalidateQueries({ queryKey: ['bookRatingEvents', book.id] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.createBook, {
    mutationFn: ({ input, userId }: CreateBookVariables) =>
      createBook({ ...input, user_id: userId }),
    onSettled: (_data, _error, { userId }: CreateBookVariables) => {
      void client.invalidateQueries({ queryKey: ['books', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.updateBook, {
    mutationFn: ({ id, patch }: UpdateBookVariables) => updateBook(id, patch),
    onSettled: (_data, _error, { id, userId }: UpdateBookVariables) => {
      void client.invalidateQueries({ queryKey: ['books', userId] })
      void client.invalidateQueries({ queryKey: ['book', id] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.deleteBook, {
    mutationFn: ({ id }: DeleteBookVariables) => deleteBook(id),
    onSettled: (_data, _error, { userId }: DeleteBookVariables) => {
      void client.invalidateQueries({ queryKey: ['books', userId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.createBookNote, {
    mutationFn: ({ userId, bookId, body, page }: CreateBookNoteVariables) =>
      createBookNote({ user_id: userId, book_id: bookId, body, page }),
    onSettled: (_data, _error, { bookId }: CreateBookNoteVariables) => {
      void client.invalidateQueries({ queryKey: ['bookNotes', bookId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.deleteBookNote, {
    mutationFn: ({ id }: DeleteBookNoteVariables) => deleteBookNote(id),
    onSettled: (_data, _error, { bookId }: DeleteBookNoteVariables) => {
      void client.invalidateQueries({ queryKey: ['bookNotes', bookId] })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.sendFriendRequest, {
    mutationFn: ({ requesterId, addresseeId }: SendFriendRequestVariables) =>
      sendFriendRequest(requesterId, addresseeId),
    onSettled: (_data, _error, { requesterId }: SendFriendRequestVariables) => {
      void client.invalidateQueries({ queryKey: socialKeys.friendships(requesterId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.acceptFriendRequest, {
    mutationFn: ({ friendshipId }: AcceptFriendRequestVariables) =>
      acceptFriendRequest(friendshipId),
    onSettled: (_data, _error, { userId }: AcceptFriendRequestVariables) => {
      void client.invalidateQueries({ queryKey: socialKeys.friendships(userId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.removeFriendship, {
    mutationFn: ({ friendshipId }: RemoveFriendshipVariables) => removeFriendship(friendshipId),
    onSettled: (_data, _error, { userId }: RemoveFriendshipVariables) => {
      void client.invalidateQueries({ queryKey: socialKeys.friendships(userId) })
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.updateProfile, {
    mutationFn: ({ userId, patch }: UpdateProfileVariables) => updateOwnProfile(userId, patch),
    onSuccess: (profile, { userId }: UpdateProfileVariables) => {
      client.setQueryData(['profile', userId], profile)
    },
  })

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.sendFeedback, {
    mutationFn: ({ userId, body }: SendFeedbackVariables) => submitFeedback(userId, body),
  })
}
