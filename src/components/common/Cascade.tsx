import { Children, isValidElement, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { prefersReducedMotion } from '@/lib/motion'
import { hasEntered } from '@/lib/routeMotion'

interface CascadeProps {
  children: ReactNode
  /** ms between each child's entrance. */
  step?: number
  /** ms before the first child starts. */
  delay?: number
  /** Cap the number of stagger steps so long lists don't drag the tail out. */
  maxSteps?: number
  className?: string
}

/**
 * Stagger direct children into view on mount — each wrapped block fades up a
 * beat after the last, so a screen assembles on open instead of snapping in.
 * Honours `prefers-reduced-motion` by rendering everything at rest immediately,
 * and plays once per screen per session — a screen you come back to is simply
 * there (motion spec, HANDOFF §3).
 *
 * Wrapping (not cloning) keeps it agnostic to what the children are: the
 * wrapper div becomes the flex/grid item, so parent `gap` still applies.
 *
 * For places a wrapper div isn't allowed (`<li>`, grid cells), use the
 * `riseStagger` helper in `@/lib/motion` to style items in place instead.
 */
export function Cascade({
  children,
  step = 80,
  delay = 40,
  maxSteps = 8,
  className,
}: CascadeProps) {
  const items = Children.toArray(children).filter(isValidElement)
  const { pathname } = useLocation()
  // Decided once per mount, so a re-render mid-cascade doesn't cut it short.
  const [still] = useState(() => prefersReducedMotion() || hasEntered(pathname))

  return (
    <>
      {items.map((child, i) => (
        <div
          key={child.key ?? i}
          className={still ? className : `animate-rise ${className ?? ''}`}
          style={
            still ? undefined : { animationDelay: `${delay + Math.min(i, maxSteps) * step}ms` }
          }
        >
          {child}
        </div>
      ))}
    </>
  )
}
