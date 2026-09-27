import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PopNumberProps {
  /** The value whose change triggers the pop. */
  value: number | string
  /** What to draw — defaults to the value itself. */
  children?: ReactNode
  className?: string
}

/**
 * A number that pops (1 → 1.14 → 1, 0.35 s spring) whenever it changes —
 * weight, reps, pages. Not on first paint: a screen opening shouldn't bounce.
 * Remounting on the value restarts the animation; reduced motion skips it.
 */
export function PopNumber({ value, children, className }: PopNumberProps) {
  const [initial] = useState(value)
  return (
    <span
      key={String(value)}
      className={cn(
        'num inline-block',
        value !== initial && 'motion-safe:animate-num-pop',
        className,
      )}
    >
      {children ?? value}
    </span>
  )
}
