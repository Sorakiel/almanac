import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_REST_SECONDS } from '@/features/workouts/lib/session'

interface SessionClock {
  /** Milliseconds since the session started (0 when not yet started). */
  elapsedMs: number
  /** Remaining rest in ms, or null when no rest timer is running. */
  restMs: number | null
  /** Start a rest countdown (defaults to the standard rest interval). */
  startRest: (seconds?: number) => void
  /** Cancel any running rest countdown. */
  skipRest: () => void
}

/**
 * Drives the live-session timers: a 1 Hz elapsed clock from the persisted
 * `startedAt`, plus an optional rest countdown started when a set is ticked.
 * Both derive from wall-clock deltas so they stay correct across a reload.
 */
export function useSessionClock(startedAt: number | null): SessionClock {
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

  // Once the countdown reaches the target instant it simply reads as null — no
  // effect needed to reset state, which keeps renders from cascading.
  return {
    elapsedMs: startedAt ? Math.max(0, now - startedAt) : 0,
    restMs: restEndsAt !== null && restEndsAt > now ? restEndsAt - now : null,
    startRest,
    skipRest,
  }
}
