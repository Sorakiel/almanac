import type { CSSProperties } from 'react'

/** True when the user has asked the OS to minimise non-essential motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface RiseOptions {
  step?: number
  delay?: number
  maxSteps?: number
}

/**
 * Per-item entrance stagger for when a wrapper div isn't allowed (e.g. `<li>`
 * inside a `<ul>`, or a grid cell). Returns a function giving the className +
 * delay style for index `i`; yields nothing under reduced motion. Tighter
 * default step than <Cascade>, since lists tend to have more items than a
 * page's top-level sections.
 */
export function riseStagger({ step = 55, delay = 0, maxSteps = 8 }: RiseOptions = {}): (
  i: number,
) => { className?: string; style?: CSSProperties } {
  if (prefersReducedMotion()) return () => ({})
  return (i: number) => ({
    className: 'animate-rise',
    style: { animationDelay: `${delay + Math.min(i, maxSteps) * step}ms` },
  })
}
