import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FocusTarget {
  habitId?: string | null
  workoutId?: string | null
  bookId?: string | null
}

interface FocusState {
  /** Epoch ms when the running session ends; null when idle. */
  endsAt: number | null
  /** Session length in minutes (for progress math). */
  durationMin: number | null
  /** What the session is about — free label, defaults to "Focus session". */
  label: string | null
  /** The habit this session targets, if any — lets "Complete" mark it done. */
  habitId: string | null
  /** The workout this session runs, if any — shows the session runner. */
  workoutId: string | null
  /** The book this session reads, if any — shows the reading runner. */
  bookId: string | null
  start: (durationMin: number, label?: string, target?: FocusTarget) => void
  stop: () => void
}

/**
 * Focus mode is a device-local timer, deliberately not a habit and not synced:
 * it survives reloads via persistence but carries no server state.
 */
export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      endsAt: null,
      durationMin: null,
      label: null,
      habitId: null,
      workoutId: null,
      bookId: null,
      start: (durationMin, label, target) =>
        set({
          endsAt: Date.now() + durationMin * 60_000,
          durationMin,
          label: label ?? null,
          habitId: target?.habitId ?? null,
          workoutId: target?.workoutId ?? null,
          bookId: target?.bookId ?? null,
        }),
      stop: () =>
        set({
          endsAt: null,
          durationMin: null,
          label: null,
          habitId: null,
          workoutId: null,
          bookId: null,
        }),
    }),
    { name: 'almanac.focus' },
  ),
)
