import { useId } from 'react'
import type { WeekPoint } from '@/features/insights/types'

interface CompletionTrendProps {
  weekly: WeekPoint[]
  height?: number
}

const VIEW_W = 1000
const VIEW_H = 160
const PAD_Y = 14

/** Completion-over-time area chart — inline SVG, stretched to container width. */
export function CompletionTrend({ weekly, height = 170 }: CompletionTrendProps) {
  const gradientId = useId()

  if (weekly.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-card bg-panel text-sm text-muted"
        style={{ height }}
      >
        Not enough history yet
      </div>
    )
  }

  const stepX = VIEW_W / (weekly.length - 1)
  const points = weekly.map((w, i) => {
    const x = i * stepX
    const y = PAD_Y + (1 - w.rate) * (VIEW_H - PAD_Y * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = points.join(' ')
  const area = `${line} ${VIEW_W},${VIEW_H} 0,${VIEW_H}`

  return (
    <div className="rounded-card bg-panel p-5 pb-4">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Completion over the last weeks"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--color-accent))" stopOpacity="0.32" />
            <stop offset="1" stopColor="rgb(var(--color-accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke="rgb(var(--color-accent))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-strong">
        {weekly.map((w) => (
          <span key={w.label}>{w.label}</span>
        ))}
      </div>
    </div>
  )
}
