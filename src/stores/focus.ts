import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FocusTarget {
  habitId?: string | null
  bookId?: string | null
}

interface FocusState {
  /** Epoch ms when the running session ends; null when idle. */
  endsAt: number | null
  /** Session length in minutes (for progress math). */
  durationMin: number | null
  /** What the session is about — free label, defaults to "Focus session". */
  label: string | null
  /** The habit this session targets, if any — lets finishing mark it done. */
  habitId: string | null
  /** The book this session reads, if any — shows the reading runner. */
  bookId: string | null
  /** Epoch ms the session was paused at; null while it runs. */
  pausedAt: number | null
  start: (durationMin: number, label?: string, target?: FocusTarget) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

/** What is left of a session at `now` — frozen while paused, never negative. */
export function focusMsLeft(
  s: Pick<FocusState, 'endsAt' | 'pausedAt'>,
  now: number = Date.now(),
): number {
  if (s.endsAt === null) return 0
  return Math.max(0, s.endsAt - (s.pausedAt ?? now))
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
      bookId: null,
      pausedAt: null,
      start: (durationMin, label, target) =>
        set({
          endsAt: Date.now() + durationMin * 60_000,
          durationMin,
          label: label ?? null,
          habitId: target?.habitId ?? null,
          bookId: target?.bookId ?? null,
          pausedAt: null,
        }),
      pause: () =>
        set((s) => (s.endsAt !== null && s.pausedAt === null ? { pausedAt: Date.now() } : s)),
      // The pause moves the end out by exactly as long as it lasted.
      resume: () =>
        set((s) =>
          s.endsAt !== null && s.pausedAt !== null
            ? { endsAt: s.endsAt + (Date.now() - s.pausedAt), pausedAt: null }
            : s,
        ),
      stop: () =>
        set({
          endsAt: null,
          durationMin: null,
          label: null,
          habitId: null,
          bookId: null,
          pausedAt: null,
        }),
    }),
    { name: 'almanac.focus' },
  ),
)
