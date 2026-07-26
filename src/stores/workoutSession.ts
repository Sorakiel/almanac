import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkoutSessionState {
  /** Epoch ms when each workout's live session started, keyed by workout id. */
  startedAt: Record<string, number>
  /** Begin (or resume) a session — never resets an already-running clock. */
  start: (workoutId: string) => void
  /** Clear a session's clock once it's finished or abandoned. */
  end: (workoutId: string) => void
}

/**
 * A live workout session is a device-local clock, deliberately not server state:
 * it survives reloads via persistence so the elapsed timer keeps counting, but
 * carries nothing that needs syncing. Set logs (the real record) live in the DB.
 */
export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set) => ({
      startedAt: {},
      start: (workoutId) =>
        set((state) =>
          state.startedAt[workoutId]
            ? state
            : { startedAt: { ...state.startedAt, [workoutId]: Date.now() } },
        ),
      end: (workoutId) =>
        set((state) => {
          if (!state.startedAt[workoutId]) return state
          const next = { ...state.startedAt }
          delete next[workoutId]
          return { startedAt: next }
        }),
    }),
    { name: 'almanac.workout-session' },
  ),
)
