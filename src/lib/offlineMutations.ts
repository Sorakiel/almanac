import type { QueryClient, QueryKey } from '@tanstack/react-query'
import {
  addFreeze,
  archiveHabit,
  createHabit,
  createSubtask,
  createSubtasksBulk,
  deleteHabit,
  deleteSubtask,
  removeFreeze,
  restoreHabit,
  setHabitCount,
  setSubtaskCompletedDates,
  updateHabit,
  updateHabitOrder,
  type ChecklistDraftItem,
} from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitSubtask, HabitWithTodayLog } from '@/features/habits/types'
import type { HabitFormInput } from '@/features/habits/hooks/useHabitMutations'
import { updateSet } from '@/features/workouts/api/session.api'
import { createWorkout, deleteWorkout, updateWorkout } from '@/features/workouts/api/workouts.api'
import type { WorkoutFormInput } from '@/features/workouts/hooks/useWorkoutMutations'
import type { SetLog, Workout } from '@/features/workouts/types'
import {
  createReflection,
  deleteReflection,
  restoreReflection,
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
import { progressPatch } from '@/features/reading/lib/progress'
import {
  acceptFriendRequest,
  emitActivity,
  removeFriendship,
  sendFriendRequest,
} from '@/features/social/api/social.api'
import { socialKeys } from '@/features/social/hooks/queryKeys'
import type { Book, BookInsert, BookNote } from '@/features/reading/types'
import type { Reflection } from '@/features/reflect/types'
import { submitFeedback } from '@/features/modules/api/feedback.api'
import { updateOwnProfile, type Profile } from '@/features/settings/api/profiles.api'
import type { Database } from '@/types/database.generated'
import { readingKeys } from '@/features/reading/hooks/queryKeys'
import { reflectKeys } from '@/features/reflect/hooks/queryKeys'
import { workoutKeys } from '@/features/workouts/hooks/queryKeys'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Every offline-durable mutation key is namespaced under `'offline'` — that
 * prefix is also how `queryClient.ts` decides what to persist. A write path
 * not registered here must never be dehydrated: a resumed mutation with no
 * registered default fails on sight with "No mutationFn found", which loses
 * the tap *and* shows an error. See `OFFLINE_MUTATION_ROOT`.
 */
export const OFFLINE_MUTATION_ROOT = 'offline'

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
  /**
   * Chosen on the client so the habit exists in the cache — and can be
   * undone, toggled, opened — before the server has seen it. Optional only
   * because a write queued by an older build may still be persisted.
   */
  id?: string
  checklist?: ChecklistDraftItem[]
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

export interface RestoreHabitVariables {
  habit: Habit
  userId: string
}

export interface DeleteHabitVariables {
  id: string
  userId: string
}

export interface SetHabitCountVariables {
  userId: string
  habitId: string
  date: string
  count: number
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
  /** Client-chosen, as for habits; optional for writes queued by an older build. */
  id?: string
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

export interface RestoreReflectionVariables {
  /** The whole row, so the Undo can put it back before the server answers. */
  reflection: Reflection
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
  /** Client-chosen, as for habits; optional for writes queued by an older build. */
  id?: string
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
 * A mutation key that also carries its write's result and variables types, so
 * the registered default and every hook using the key agree by construction —
 * `useOfflineMutation` infers both from the key alone.
 */
export type OfflineKey<TData, TVariables> = readonly [typeof OFFLINE_MUTATION_ROOT, string] & {
  readonly __types?: (variables: TVariables) => TData
}

function offlineKey<TData, TVariables>(name: string): OfflineKey<TData, TVariables> {
  return [OFFLINE_MUTATION_ROOT, name] as OfflineKey<TData, TVariables>
}

export const OFFLINE_MUTATION_KEYS = {
  toggleHabit: offlineKey<void, ToggleHabitVariables>('toggleHabit'),
  editSet: offlineKey<void, EditSetVariables>('editSet'),
  toggleFreeze: offlineKey<void, ToggleFreezeVariables>('toggleFreeze'),
  toggleSubtask: offlineKey<void, ToggleSubtaskVariables>('toggleSubtask'),
  createHabit: offlineKey<Habit, CreateHabitVariables>('createHabit'),
  updateHabit: offlineKey<Habit, UpdateHabitVariables>('updateHabit'),
  archiveHabit: offlineKey<void, ArchiveHabitVariables>('archiveHabit'),
  restoreHabit: offlineKey<void, RestoreHabitVariables>('restoreHabit'),
  deleteHabit: offlineKey<void, DeleteHabitVariables>('deleteHabit'),
  setHabitCount: offlineKey<void, SetHabitCountVariables>('setHabitCount'),
  reorderHabits: offlineKey<void, ReorderHabitsVariables>('reorderHabits'),
  createSubtask: offlineKey<HabitSubtask, CreateSubtaskVariables>('createSubtask'),
  deleteSubtask: offlineKey<void, DeleteSubtaskVariables>('deleteSubtask'),
  createWorkout: offlineKey<Workout, CreateWorkoutVariables>('createWorkout'),
  updateWorkout: offlineKey<Workout, UpdateWorkoutVariables>('updateWorkout'),
  deleteWorkout: offlineKey<void, DeleteWorkoutVariables>('deleteWorkout'),
  toggleWorkoutComplete: offlineKey<Workout, ToggleWorkoutCompleteVariables>(
    'toggleWorkoutComplete',
  ),
  saveReflection: offlineKey<Reflection, SaveReflectionVariables>('saveReflection'),
  deleteReflection: offlineKey<void, DeleteReflectionVariables>('deleteReflection'),
  restoreReflection: offlineKey<void, RestoreReflectionVariables>('restoreReflection'),
  logReadingProgress: offlineKey<void, LogReadingProgressVariables>('logReadingProgress'),
  rateBook: offlineKey<void, RateBookVariables>('rateBook'),
  createBook: offlineKey<Book, CreateBookVariables>('createBook'),
  updateBook: offlineKey<Book, UpdateBookVariables>('updateBook'),
  deleteBook: offlineKey<void, DeleteBookVariables>('deleteBook'),
  createBookNote: offlineKey<BookNote, CreateBookNoteVariables>('createBookNote'),
  deleteBookNote: offlineKey<void, DeleteBookNoteVariables>('deleteBookNote'),
  sendFriendRequest: offlineKey<void, SendFriendRequestVariables>('sendFriendRequest'),
  acceptFriendRequest: offlineKey<void, AcceptFriendRequestVariables>('acceptFriendRequest'),
  removeFriendship: offlineKey<void, RemoveFriendshipVariables>('removeFriendship'),
  updateProfile: offlineKey<Profile, UpdateProfileVariables>('updateProfile'),
  sendFeedback: offlineKey<void, SendFeedbackVariables>('sendFeedback'),
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
  /** Register `mutationFn` and the query keys it leaves stale once settled. */
  const register = <TData, TVariables>(
    key: OfflineKey<TData, TVariables>,
    mutationFn: (variables: TVariables) => Promise<TData>,
    invalidates: (variables: TVariables) => QueryKey[] = () => [],
    scope?: { id: string },
  ): void => {
    client.setMutationDefaults(key, {
      mutationFn,
      scope,
      onSettled: (_data, _error, variables: TVariables) => {
        for (const queryKey of invalidates(variables)) void client.invalidateQueries({ queryKey })
      },
    })
  }

  // Habit writes run one at a time, in the order they were made. A habit can
  // now be created, ticked and undone while offline, and unordered those
  // writes land nonsensically: the tick before the habit exists (a foreign-key
  // error), or the Undo's archive before the insert it was meant to cancel.
  // The scope is dehydrated with the mutation, so the order survives a reload.
  const HABITS = { id: 'habits' }

  register(
    OFFLINE_MUTATION_KEYS.toggleHabit,
    ({ habit, userId, date }) => {
      const nextCount = habit.isComplete ? 0 : habit.todayCount + 1
      return setHabitCount({ userId, habitId: habit.id, date, count: nextCount })
    },
    ({ userId }) => [habitKeys.logsRoot(userId)],
    HABITS,
  )
  register(
    OFFLINE_MUTATION_KEYS.setHabitCount,
    (variables) => setHabitCount(variables),
    ({ userId, habitId }) => [habitKeys.logsRoot(userId), habitKeys.history(habitId)],
    HABITS,
  )

  register(
    OFFLINE_MUTATION_KEYS.editSet,
    ({ id, patch }) => updateSet(id, patch),
    ({ workoutId }) => [workoutKeys.session(workoutId)],
  )

  register(
    OFFLINE_MUTATION_KEYS.toggleFreeze,
    ({ userId, habitId, date, freeze }) =>
      freeze ? addFreeze(userId, habitId, date) : removeFreeze(habitId, date),
    ({ userId, habitId }) => [habitKeys.freezesRoot(userId), habitKeys.freezesOf(habitId)],
    HABITS,
  )

  // Only the checklist write itself is guaranteed here — the follow-up sync
  // that rolls a fully-checked list into the habit's own count
  // (syncHabitCompletion in useHabitSubtasks) stays live-only. It still runs
  // normally for a resume within the same session (the live mutation object
  // survives); it just won't run for a mutation resumed after a cold start,
  // which is an acceptable gap: the checklist state itself is never lost,
  // only the derived habit-count mirror, which the next toggle re-syncs.
  register(
    OFFLINE_MUTATION_KEYS.toggleSubtask,
    ({ subtaskId, dates }) => setSubtaskCompletedDates(subtaskId, dates),
    ({ habitId }) => [habitKeys.subtasks(habitId)],
    HABITS,
  )

  const habitLists = ({ userId }: { userId: string }): QueryKey[] => [
    habitKeys.all(userId),
    habitKeys.detailRoot(),
  ]
  register(
    OFFLINE_MUTATION_KEYS.createHabit,
    async ({ input, userId, id, checklist = [] }) => {
      const habit = await createHabit({ ...input, id, user_id: userId })
      if (checklist.length > 0) await createSubtasksBulk(userId, habit.id, checklist)
      return habit
    },
    ({ userId, id }) => [...habitLists({ userId }), ...(id ? [habitKeys.subtasks(id)] : [])],
    HABITS,
  )
  register(
    OFFLINE_MUTATION_KEYS.updateHabit,
    ({ id, input }) => updateHabit(id, input),
    habitLists,
    HABITS,
  )
  register(OFFLINE_MUTATION_KEYS.archiveHabit, ({ id }) => archiveHabit(id), habitLists, HABITS)
  register(
    OFFLINE_MUTATION_KEYS.restoreHabit,
    ({ habit }) => restoreHabit(habit.id),
    habitLists,
    HABITS,
  )
  // For good: the logs and freezes it takes with it leave every window stale.
  // Not `detailRoot`, though — refetching the deleted habit's own page would
  // only ask the server for a row that is gone (a 406 from `.single()`).
  register(
    OFFLINE_MUTATION_KEYS.deleteHabit,
    ({ id }) => deleteHabit(id),
    ({ userId }) => [
      habitKeys.all(userId),
      habitKeys.logsRoot(userId),
      habitKeys.freezesRoot(userId),
    ],
    HABITS,
  )
  register(
    OFFLINE_MUTATION_KEYS.reorderHabits,
    ({ ordered }) => updateHabitOrder(ordered),
    ({ userId }) => [habitKeys.all(userId)],
    HABITS,
  )

  register(
    OFFLINE_MUTATION_KEYS.createSubtask,
    ({ userId, habitId, title, sortOrder }) => createSubtask(userId, habitId, title, sortOrder),
    ({ habitId }) => [habitKeys.subtasks(habitId)],
    HABITS,
  )
  register(
    OFFLINE_MUTATION_KEYS.deleteSubtask,
    ({ id }) => deleteSubtask(id),
    ({ habitId }) => [habitKeys.subtasks(habitId)],
    HABITS,
  )

  const workoutList = ({ userId }: { userId: string }): QueryKey[] => [workoutKeys.all(userId)]
  // A workout can now exist before the server has it, so its edit, its
  // completion and its sets must not overtake the insert.
  const WORKOUTS = { id: 'workouts' }
  register(
    OFFLINE_MUTATION_KEYS.createWorkout,
    ({ input, userId, id }) => createWorkout({ ...input, id, user_id: userId }),
    workoutList,
    WORKOUTS,
  )
  register(
    OFFLINE_MUTATION_KEYS.updateWorkout,
    ({ id, input }) => updateWorkout(id, input),
    workoutList,
    WORKOUTS,
  )
  register(
    OFFLINE_MUTATION_KEYS.deleteWorkout,
    ({ id }) => deleteWorkout(id),
    workoutList,
    WORKOUTS,
  )

  // Shared by useWorkoutMutations' toggleComplete (list view) and
  // useSessionMutations' setCompleted (in-session finish button) — same
  // underlying write, two call sites.
  register(
    OFFLINE_MUTATION_KEYS.toggleWorkoutComplete,
    ({ id, done }) => updateWorkout(id, { completed_at: done ? new Date().toISOString() : null }),
    ({ id, userId }) => [workoutKeys.detail(id), workoutKeys.all(userId)],
    WORKOUTS,
  )

  const reflectionList = ({ userId }: { userId: string }): QueryKey[] => [reflectKeys.all(userId)]
  // A delete and its Undo re-insert the same id: unordered, the insert can
  // land first and the delete then erases the entry the user just brought back.
  const REFLECTIONS = { id: 'reflections' }
  register(
    OFFLINE_MUTATION_KEYS.saveReflection,
    ({ id, date, body, quoteId, mood, energy, dayRating, userId }) =>
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
    reflectionList,
    REFLECTIONS,
  )
  register(
    OFFLINE_MUTATION_KEYS.deleteReflection,
    ({ id }) => deleteReflection(id),
    reflectionList,
    REFLECTIONS,
  )
  register(
    OFFLINE_MUTATION_KEYS.restoreReflection,
    ({ reflection }) => restoreReflection(reflection),
    reflectionList,
    REFLECTIONS,
  )

  // Same reason as habits and workouts: a book created offline must reach the
  // server before the progress, ratings and notes that reference it.
  const BOOKS = { id: 'books' }
  register(
    OFFLINE_MUTATION_KEYS.logReadingProgress,
    async ({ book, nextUnit, minutes, userId, dateKey }) => {
      const { patch, delta } = progressPatch(book, nextUnit, dateKey)
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
    ({ book, userId }) => [
      readingKeys.books(userId),
      readingKeys.book(book.id),
      readingKeys.sessions(book.id),
    ],
    BOOKS,
  )

  register(
    OFFLINE_MUTATION_KEYS.rateBook,
    async ({ book, rating, userId }) => {
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
    ({ book, userId }) => [readingKeys.books(userId), readingKeys.book(book.id)],
    BOOKS,
  )

  register(
    OFFLINE_MUTATION_KEYS.createBook,
    ({ input, userId, id }) => createBook({ ...input, id, user_id: userId }),
    ({ userId }) => [readingKeys.books(userId)],
    BOOKS,
  )
  register(
    OFFLINE_MUTATION_KEYS.updateBook,
    ({ id, patch }) => updateBook(id, patch),
    ({ id, userId }) => [readingKeys.books(userId), readingKeys.book(id)],
    BOOKS,
  )
  register(
    OFFLINE_MUTATION_KEYS.deleteBook,
    ({ id }) => deleteBook(id),
    ({ userId }) => [readingKeys.books(userId)],
    BOOKS,
  )

  register(
    OFFLINE_MUTATION_KEYS.createBookNote,
    ({ userId, bookId, body, page }) =>
      createBookNote({ user_id: userId, book_id: bookId, body, page }),
    ({ bookId }) => [readingKeys.notes(bookId)],
    BOOKS,
  )
  register(
    OFFLINE_MUTATION_KEYS.deleteBookNote,
    ({ id }) => deleteBookNote(id),
    ({ bookId }) => [readingKeys.notes(bookId)],
    BOOKS,
  )

  register(
    OFFLINE_MUTATION_KEYS.sendFriendRequest,
    ({ requesterId, addresseeId }) => sendFriendRequest(requesterId, addresseeId),
    ({ requesterId }) => [socialKeys.friendships(requesterId)],
  )
  register(
    OFFLINE_MUTATION_KEYS.acceptFriendRequest,
    ({ friendshipId }) => acceptFriendRequest(friendshipId),
    ({ userId }) => [socialKeys.friendships(userId)],
  )
  register(
    OFFLINE_MUTATION_KEYS.removeFriendship,
    ({ friendshipId }) => removeFriendship(friendshipId),
    ({ userId }) => [socialKeys.friendships(userId)],
  )

  client.setMutationDefaults(OFFLINE_MUTATION_KEYS.updateProfile, {
    mutationFn: ({ userId, patch }: UpdateProfileVariables) => updateOwnProfile(userId, patch),
    onSuccess: (profile, { userId }: UpdateProfileVariables) => {
      client.setQueryData(['profile', userId], profile)
    },
  })

  register(OFFLINE_MUTATION_KEYS.sendFeedback, ({ userId, body }) => submitFeedback(userId, body))
}

/** Writes whose `id` variable is the habit's own id (the rest carry `habit` or `habitId`). */
const HABIT_ROW_WRITES = new Set(['createHabit', 'updateHabit', 'archiveHabit'])

/**
 * The habit a queued write touches, if any — so its row can show that
 * something about it has not reached the server yet.
 */
export function habitIdOfWrite(
  mutationKey: readonly unknown[] | undefined,
  variables: unknown,
): string | null {
  if (
    mutationKey?.[0] !== OFFLINE_MUTATION_ROOT ||
    typeof variables !== 'object' ||
    variables === null
  ) {
    return null
  }
  const v = variables as { habit?: { id?: unknown }; habitId?: unknown; id?: unknown }
  if (typeof v.habit?.id === 'string') return v.habit.id
  if (typeof v.habitId === 'string') return v.habitId
  if (HABIT_ROW_WRITES.has(String(mutationKey[1])) && typeof v.id === 'string') return v.id
  return null
}
