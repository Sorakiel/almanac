import { useEffect, useRef } from 'react'
import { useSession } from '@/hooks/useSession'
import { emitActivity } from '@/features/social/api/social.api'

/**
 * Record a "closed the day" activity event when every habit due today is done.
 * This is a one-shot idempotent WRITE (not a data fetch): the DB has a unique
 * index on (user_id, event_date) for day events, so re-firing is a harmless
 * no-op, and a per-day ref stops us pinging on every render. It powers the
 * signature feed item — "friend closed 5/5". Best-effort; failures are ignored.
 */
export function useDayCompletionBeacon(done: number, total: number, dateKey: string): void {
  const { user } = useSession()
  const userId = user?.id ?? ''
  const firedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || total <= 0 || done < total) return
    if (firedFor.current === dateKey) return
    firedFor.current = dateKey
    void emitActivity({
      user_id: userId,
      kind: 'day_completed',
      event_date: dateKey,
      meta: { done, total },
    }).catch(() => undefined)
  }, [userId, done, total, dateKey])
}
