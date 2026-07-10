import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FocusState {
  /** Epoch ms when the running session ends; null when idle. */
  endsAt: number | null
  /** Session length in minutes (for progress math). */
  durationMin: number | null
  /** What the session is about — free label, defaults to "Focus session". */
  label: string | null
  start: (durationMin: number, label?: string) => void
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
      start: (durationMin, label) =>
        set({ endsAt: Date.now() + durationMin * 60_000, durationMin, label: label ?? null }),
      stop: () => set({ endsAt: null, durationMin: null, label: null }),
    }),
    { name: 'almanac.focus' },
  ),
)
