import { prefersReducedMotion } from '@/lib/motion'

/**
 * View Transitions helpers. Every entry point degrades gracefully: when the
 * browser lacks the API (or the user prefers reduced motion) the mutation still
 * runs, just without the animation.
 */

interface Point {
  x: number
  y: number
}

type ViewTransition = { finished: Promise<void> }
type TransitionDoc = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition
}

// Where the user last pressed — so a state change caused by that press can
// radiate its transition from the right spot (e.g. the theme wipe).
let lastPointer: Point | null = null

/** Start tracking pointer position once, at app boot. */
export function initPointerTracking(): void {
  if (typeof window === 'undefined') return
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY }
    },
    { capture: true, passive: true },
  )
}

function supported(): TransitionDoc | null {
  if (typeof document === 'undefined') return null
  const doc = document as TransitionDoc
  return typeof doc.startViewTransition === 'function' ? doc : null
}

/**
 * Swap the theme with a circular reveal that grows from the last press. Sets
 * the origin + radius as CSS custom properties and toggles `.theme-vt` on
 * <html> so the stylesheet can target just this transition (routes keep their
 * own cross-fade).
 */
export function themeViewTransition(mutate: () => void): void {
  const doc = supported()
  if (!doc || prefersReducedMotion()) {
    mutate()
    return
  }

  const p = lastPointer ?? { x: window.innerWidth / 2, y: 0 }
  const root = document.documentElement
  // Radius reaching the farthest corner, so the circle fully covers the screen.
  const radius = Math.hypot(
    Math.max(p.x, window.innerWidth - p.x),
    Math.max(p.y, window.innerHeight - p.y),
  )
  root.style.setProperty('--vt-x', `${p.x}px`)
  root.style.setProperty('--vt-y', `${p.y}px`)
  root.style.setProperty('--vt-r', `${radius}px`)
  root.classList.add('theme-vt')

  const transition = doc.startViewTransition(mutate)
  void transition.finished.finally(() => root.classList.remove('theme-vt'))
}
