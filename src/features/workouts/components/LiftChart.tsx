import type { LiftSeries } from '@/features/workouts/lib/history'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface LiftChartProps {
  lift: LiftSeries | null
  /** Name the empty card — where no section title sits above it (desktop). */
  titled?: boolean
}

const W = 300
const H = 80
const VIEW_H = 90

/**
 * The main lift's heaviest set per session (the prototype's `.m-chart`): a teal
 * line over a soft fill, the latest point marked. Until there are two weighted
 * sessions it says so instead of drawing one dot.
 */
export function LiftChart({ lift, titled = false }: LiftChartProps) {
  const { t, locale } = useT()

  if (!lift) {
    return (
      <div className="rounded-card bg-surface p-3.5">
        {titled ? (
          <p className="mx-0.5 mb-1 text-body font-semibold">{t('workouts.lift.title')}</p>
        ) : null}
        <p className="mx-0.5 text-callout text-muted">{t('workouts.lift.empty')}</p>
      </div>
    )
  }

  const min = Math.min(...lift.points)
  const span = Math.max(...lift.points) - min || 1
  const pts: [number, number][] = lift.points.map((v, i) => [
    (i * W) / (lift.points.length - 1),
    H - ((v - min) / span) * H,
  ])
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = pts[pts.length - 1] ?? [0, 0]
  const fmt = (v: number) => v.toLocaleString(intlLocale(locale))

  return (
    <div className="rounded-card bg-surface p-3.5">
      <div className="mx-0.5 mb-2 flex items-baseline justify-between gap-3">
        <span className="truncate text-body font-semibold">{lift.name}</span>
        <span className="num flex-none text-footnote font-medium text-teal">
          {t('workouts.lift.delta', {
            value: fmt(lift.points.at(-1) ?? 0),
            sign: lift.delta >= 0 ? '+' : '−',
            delta: fmt(Math.abs(lift.delta)),
            sessions: t('workouts.lift.sessions', { count: lift.points.length }),
          })}
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={t('workouts.lift.aria', { name: lift.name })}
          className="block h-24 w-full overflow-visible"
        >
          <path d={`${path} L${W} ${VIEW_H} L0 ${VIEW_H} Z`} className="fill-teal/15" />
          <path
            d={path}
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-teal"
          />
        </svg>
        {/* A span, not an SVG circle: the stretched viewBox would squash it. */}
        <span
          aria-hidden="true"
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal"
          style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / VIEW_H) * 100}%` }}
        />
      </div>
    </div>
  )
}
