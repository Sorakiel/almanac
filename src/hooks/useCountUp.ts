import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Tween a number up to `target` — on first mount (from 0) and again whenever it
 * changes, easing out over `duration` ms. Honours `prefers-reduced-motion` by
 * snapping instantly. Returns the value to render (rounded).
 */
export function useCountUp(target: number, duration = 600): number {
  // Seed from 0 so numbers roll up when a view opens, not only on later changes.
  const seed = prefersReducedMotion() ? target : 0
  const [display, setDisplay] = useState(seed)
  const fromRef = useRef(seed)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === target || prefersReducedMotion()) {
      fromRef.current = target
      setDisplay(target)
      return
    }

    let start: number | null = null
    const step = (ts: number) => {
      if (start === null) start = ts
      const t = Math.min((ts - start) / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      fromRef.current = target
    }
  }, [target, duration])

  return display
}
