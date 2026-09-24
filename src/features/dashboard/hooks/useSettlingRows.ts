import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

/** The tick is seen in place for this long before the row leaves. */
export const SETTLE_HOLD_MS = 620
/** Then the row folds its height away — `.today-row-wrap.is-collapsing` in today.css. */
export const SETTLE_COLLAPSE_MS = 340

export type SettlePhase = 'holding' | 'collapsing'

interface SettlingRows {
  /** Rows still drawn in their group after being ticked, and what they are doing. */
  phases: ReadonlyMap<string, SettlePhase>
  /** Keep a just-ticked row in place, then fold it away into "Done". */
  settle: (id: string) => void
  /** Let a row go at once — an untick, or an Undo inside the hold. */
  release: (id: string) => void
}

/**
 * The optimistic update marks a habit done on the tap, which would move its
 * row into "Done" under the finger. This holds the row where it was while the
 * check draws, then collapses it, and only then lets it go.
 */
export function useSettlingRows(): SettlingRows {
  const [phases, setPhases] = useState<ReadonlyMap<string, SettlePhase>>(new Map())
  const timers = useRef(new Map<string, number[]>())

  const clear = useCallback((id: string) => {
    timers.current.get(id)?.forEach((timer) => window.clearTimeout(timer))
    timers.current.delete(id)
  }, [])

  const setPhase = useCallback((id: string, phase: SettlePhase | null) => {
    setPhases((previous) => {
      const next = new Map(previous)
      if (phase) next.set(id, phase)
      else next.delete(id)
      return next
    })
  }, [])

  const release = useCallback(
    (id: string) => {
      clear(id)
      setPhase(id, null)
    },
    [clear, setPhase],
  )

  const settle = useCallback(
    (id: string) => {
      clear(id)
      setPhase(id, 'holding')
      const collapse = window.setTimeout(() => setPhase(id, 'collapsing'), SETTLE_HOLD_MS)
      const done = window.setTimeout(
        () => release(id),
        SETTLE_HOLD_MS + (prefersReducedMotion() ? 0 : SETTLE_COLLAPSE_MS),
      )
      timers.current.set(id, [collapse, done])
    },
    [clear, setPhase, release],
  )

  useEffect(() => {
    const all = timers.current
    return () => all.forEach((list) => list.forEach((timer) => window.clearTimeout(timer)))
  }, [])

  return { phases, settle, release }
}
