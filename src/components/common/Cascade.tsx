import { Children, isValidElement, type ReactNode } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

interface CascadeProps {
  children: ReactNode
  /** ms between each child's entrance. */
  step?: number
  /** ms before the first child starts. */
  delay?: number
  className?: string
}

/**
 * Stagger direct children into view on mount — each wrapped block fades up a
 * beat after the last, so a screen assembles on open instead of snapping in.
 * Honours `prefers-reduced-motion` by rendering everything at rest immediately.
 *
 * Wrapping (not cloning) keeps it agnostic to what the children are: the
 * wrapper div becomes the flex/grid item, so parent `gap` still applies.
 */
export function Cascade({ children, step = 45, delay = 0, className }: CascadeProps) {
  const items = Children.toArray(children).filter(isValidElement)
  const reduce = prefersReducedMotion()

  return (
    <>
      {items.map((child, i) => (
        <div
          key={child.key ?? i}
          className={reduce ? className : `animate-rise ${className ?? ''}`}
          style={reduce ? undefined : { animationDelay: `${delay + i * step}ms` }}
        >
          {child}
        </div>
      ))}
    </>
  )
}
