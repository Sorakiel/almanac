import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SessionRecord {
  /** Epoch ms the current run segment began; null while paused. */
  startedAt: number | null
  /** Elapsed ms banked from earlier run segments (before the last pause). */
  accumulatedMs: number
}

interface WorkoutSessionState {
  /** Live sessions keyed by workout id. */
  sessions: Record<string, SessionRecord>
  /** Begin a new session, or resume a paused one; a running one stays running. */
  start: (workoutId: string) => void
  /** Freeze the elapsed clock without ending the session. */
  pause: (workoutId: string) => void
  /** Clear a session once it's finished or abandoned. */
  end: (workoutId: string) => void
}

/**
 * A live workout session is a device-local clock, deliberately not server state:
 * it survives reloads and screen changes via persistence so the elapsed timer
 * (and a pause) keep their place. Set logs — the real record — live in the DB.
 */
export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set) => ({
      sessions: {},
      start: (workoutId) =>
        set((state) => {
          const current = state.sessions[workoutId]
          if (current?.startedAt) return state // already running
          const record: SessionRecord = {
            startedAt: Date.now(),
            accumulatedMs: current?.accumulatedMs ?? 0,
          }
          return { sessions: { ...state.sessions, [workoutId]: record } }
        }),
      pause: (workoutId) =>
        set((state) => {
          const current = state.sessions[workoutId]
          if (!current?.startedAt) return state
          const banked = current.accumulatedMs + Math.max(0, Date.now() - current.startedAt)
          return {
            sessions: { ...state.sessions, [workoutId]: { startedAt: null, accumulatedMs: banked } },
          }
        }),
      end: (workoutId) =>
        set((state) => {
          if (!state.sessions[workoutId]) return state
          const next = { ...state.sessions }
          delete next[workoutId]
          return { sessions: next }
        }),
    }),
    { name: 'almanac.workout-session', version: 1 },
  ),
)

/** Total elapsed ms for a session record at instant `now`. */
export function sessionElapsed(record: SessionRecord | undefined | null, now: number): number {
  if (!record) return 0
  return record.accumulatedMs + (record.startedAt ? Math.max(0, now - record.startedAt) : 0)
}
