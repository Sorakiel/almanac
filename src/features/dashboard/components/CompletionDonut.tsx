import { useEffect, useState } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface CompletionDonutProps {
  completed: number
  total: number
  /** Rendered diameter in px. The SVG geometry scales to fit. */
  size?: number
}

const VIEW = 160
const STROKE = 14
const RADIUS = (VIEW - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

/**
 * Radial completion gauge for today's habits. The arc draws in from empty on
 * mount and eases to each new value via `stroke-dashoffset`; the centre
 * percentage counts up to match. Mono readout keeps it terminal-flavoured.
 */
export function CompletionDonut({ completed, total, size = 160 }: CompletionDonutProps) {
  const safeTotal = Math.max(total, 0)
  const pct = safeTotal === 0 ? 0 : Math.round((completed / safeTotal) * 100)

  // Start empty, then flip to the real ratio after first paint so the arc grows.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct / 100))
    return () => cancelAnimationFrame(id)
  }, [pct])

  const displayPct = useCountUp(pct)
  const big = size >= 140

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${completed} of ${total} habits complete, ${pct} percent`}
    >
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="h-full w-full -rotate-90">
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          fill="none"
          stroke="rgb(var(--color-border) / 0.15)"
          strokeWidth={STROKE}
        />
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
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
        <span
          className={cn('font-mono font-semibold tabular-nums', big ? 'text-3xl' : 'text-xl')}
        >
          {displayPct}%
        </span>
        <span className={cn('label-mono', big ? 'mt-1' : 'mt-0.5 text-[10px]')}>
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}
