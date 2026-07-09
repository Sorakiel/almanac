interface SparklineProps {
  /** Series values; rendered left→right, auto-scaled to fit. */
  values: number[]
  stroke: string
  width?: number
  height?: number
  className?: string
}

/** Minimal inline-SVG line sparkline — no chart lib overhead. */
export function Sparkline({ values, stroke, width = 72, height = 28, className }: SparklineProps) {
  if (values.length < 2) return null

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const stepX = width / (values.length - 1)
  const pad = 3

  const points = values
    .map((v, i) => {
      const x = i * stepX
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <polyline
        points={points}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
