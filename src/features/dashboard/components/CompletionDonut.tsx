import { useEffect, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'

interface CompletionDonutProps {
  completed: number
  total: number
}

const SIZE = 160
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

/**
 * Radial completion gauge for today's habits. The arc draws in from empty on
 * mount and eases to each new value via `stroke-dashoffset`; the centre
 * percentage counts up to match. Hand-rolled SVG so the draw is fully ours.
 */
export function CompletionDonut({ completed, total }: CompletionDonutProps) {
  const safeTotal = Math.max(total, 0)
  const pct = safeTotal === 0 ? 0 : Math.round((completed / safeTotal) * 100)

  // Start empty, then flip to the real ratio after first paint so the arc grows.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct / 100))
    return () => cancelAnimationFrame(id)
  }, [pct])

  const displayPct = useCountUp(pct)

  return (
    <div
      className="relative h-40 w-40"
      role="img"
      aria-label={`${completed} of ${total} habits complete, ${pct} percent`}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgb(var(--color-border) / 0.15)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgb(var(--color-accent))"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - shown)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums">{displayPct}%</span>
        <span className="label-mono mt-1">
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}
