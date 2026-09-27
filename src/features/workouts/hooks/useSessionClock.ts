import { useCallback, useState } from 'react'
import { useNow } from '@/hooks/useNow'
import { DEFAULT_REST_SECONDS } from '@/features/workouts/lib/session'
import { sessionElapsed, type SessionRecord } from '@/features/workouts/stores/workoutSession'

interface SessionClock {
  /** Milliseconds elapsed for the session (frozen while paused). */
  elapsedMs: number
  /** True while the elapsed clock is running (false when paused / absent). */
  running: boolean
  /** Remaining rest in ms, or null when no rest timer is running. */
  restMs: number | null
  /** Length of the current (or last) rest, in ms — the ring's full circle. */
  restTotalMs: number
  /** When the running rest ends (epoch ms) — identifies one rest from the next. */
  restEndsAt: number | null
  /** Start a rest countdown (defaults to the standard rest interval). */
  startRest: (seconds?: number) => void
  /** Cancel any running rest countdown. */
  skipRest: () => void
  /** Move the running rest's end by `seconds` (−15 / +15); ending it if that runs it out. */
  adjustRest: (seconds: number) => void
}

/**
 * Drives the live-session timers: a 1 Hz elapsed clock derived from the
 * persisted session record (so it survives reloads and honours a pause), plus
 * an optional rest countdown started when a set is ticked.
 */
export function useSessionClock(record: SessionRecord | null | undefined): SessionClock {
  const now = useNow()
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [restTotalMs, setRestTotalMs] = useState(DEFAULT_REST_SECONDS * 1000)

  const startRest = useCallback((seconds = DEFAULT_REST_SECONDS) => {
    setRestEndsAt(Date.now() + seconds * 1000)
    setRestTotalMs(seconds * 1000)
  }, [])

  const skipRest = useCallback(() => setRestEndsAt(null), [])

  const adjustRest = useCallback((seconds: number) => {
    setRestEndsAt((endsAt) => {
      if (endsAt === null) return null
      const next = endsAt + seconds * 1000
      const left = next - Date.now()
      // Under a second left reads as done: the ring would only flash empty.
      if (left <= 1000) return null
      setRestTotalMs((total) => Math.max(total, left))
      return next
    })
  }, [])

  // The rest timer reads as null once it passes its target — no effect needed
  // to reset state, which keeps renders from cascading.
  return {
    elapsedMs: sessionElapsed(record, now),
    running: Boolean(record?.startedAt),
    restMs: restEndsAt !== null && restEndsAt > now ? restEndsAt - now : null,
    restTotalMs,
    restEndsAt,
    startRest,
    skipRest,
    adjustRest,
  }
}
