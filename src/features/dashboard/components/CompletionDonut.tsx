import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

interface CompletionDonutProps {
  completed: number
  total: number
}

/** Radial completion gauge for today's habits, with a centered percentage. */
export function CompletionDonut({ completed, total }: CompletionDonutProps) {
  const safeTotal = Math.max(total, 0)
  const pct = safeTotal === 0 ? 0 : Math.round((completed / safeTotal) * 100)
  const data = [
    { name: 'done', value: completed },
    { name: 'remaining', value: Math.max(safeTotal - completed, safeTotal === 0 ? 1 : 0) },
  ]

  return (
    <div
      className="relative h-40 w-40"
      role="img"
      aria-label={`${completed} of ${total} habits complete, ${pct} percent`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="rgb(var(--color-accent))" />
            <Cell fill="rgb(var(--color-border) / 0.15)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums">{pct}%</span>
        <span className="label-mono mt-1">
          {completed}/{total}
        </span>
      </div>
    </div>
  )
}
