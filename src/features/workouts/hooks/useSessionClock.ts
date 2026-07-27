import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_REST_SECONDS } from '@/features/workouts/lib/session'
import { sessionElapsed, type SessionRecord } from '@/stores/workoutSession'

interface SessionClock {
  /** Milliseconds elapsed for the session (frozen while paused). */
  elapsedMs: number
  /** True while the elapsed clock is running (false when paused / absent). */
  running: boolean
  /** Remaining rest in ms, or null when no rest timer is running. */
  restMs: number | null
  /** Start a rest countdown (defaults to the standard rest interval). */
  startRest: (seconds?: number) => void
  /** Cancel any running rest countdown. */
  skipRest: () => void
}

/**
 * Drives the live-session timers: a 1 Hz elapsed clock derived from the
 * persisted session record (so it survives reloads and honours a pause), plus
 * an optional rest countdown started when a set is ticked.
 */
export function useSessionClock(record: SessionRecord | null | undefined): SessionClock {
  const [now, setNow] = useState(() => Date.now())
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const startRest = useCallback((seconds = DEFAULT_REST_SECONDS) => {
    setRestEndsAt(Date.now() + seconds * 1000)
  }, [])

  const skipRest = useCallback(() => setRestEndsAt(null), [])

  // The rest timer reads as null once it passes its target — no effect needed
  // to reset state, which keeps renders from cascading.
  return {
    elapsedMs: sessionElapsed(record, now),
    running: Boolean(record?.startedAt),
    restMs: restEndsAt !== null && restEndsAt > now ? restEndsAt - now : null,
    startRest,
    skipRest,
  }
}
