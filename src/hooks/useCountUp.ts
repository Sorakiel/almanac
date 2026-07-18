import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * Tween a number toward `target` whenever it changes, easing out over
 * `duration` ms. Honours `prefers-reduced-motion` by snapping instantly.
 * Returns the value to render (rounded).
 */
export function useCountUp(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
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
