import { useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface DrainArcProps {
  r: number
  circumference: number
  remainingMs: number
  totalMs: number
  className?: string
}

/**
 * The rest countdown's arc. Mounted once per rest (the parent keys it), it
 * reads how far into the rest it was mounted and hands the rest to one CSS
 * animation — so the ring drains continuously instead of stepping on each
 * 1 Hz tick, with no animation-frame loop. The inline offset is the
 * reduced-motion fallback, updated by those same ticks.
 */
export function DrainArc({ r, circumference, remainingMs, totalMs, className }: DrainArcProps) {
  // Frozen at mount: re-deriving the delay on every tick would count the
  // elapsed time twice against the animation's own clock.
  const [intoRestMs] = useState(() => Math.max(0, totalMs - remainingMs))
  const ratio = Math.min(1, remainingMs / Math.max(totalMs, 1))
  const style = {
    strokeDashoffset: circumference * (1 - ratio),
    '--ring-c': `${circumference}`,
    '--drain-ms': `${totalMs}ms`,
    '--drain-delay': `-${intoRestMs}ms`,
  } as CSSProperties

  return (
    <circle
      cx="60"
      cy="60"
      r={r}
      fill="none"
      strokeWidth="7"
      strokeLinecap="round"
      strokeDasharray={circumference}
      style={style}
      className={cn('ring-drain', className)}
    />
  )
}
