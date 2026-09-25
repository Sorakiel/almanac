import type { CSSProperties } from 'react'
import { hasEntered } from '@/lib/routeMotion'

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
 * delay style for index `i`; yields nothing under reduced motion or on a
 * return visit. Tighter
 * default step than <Cascade>, since lists tend to have more items than a
 * page's top-level sections.
 */
export function riseStagger({ step = 55, delay = 0, maxSteps = 8 }: RiseOptions = {}): (
  i: number,
) => { className?: string; style?: CSSProperties } {
  // Like <Cascade>: only on a screen's first visit this session.
  const path = typeof window === 'undefined' ? '' : window.location.pathname
  if (prefersReducedMotion() || hasEntered(path)) return () => ({})
  return (i: number) => ({
    className: 'animate-rise',
    style: { animationDelay: `${delay + Math.min(i, maxSteps) * step}ms` },
  })
}
