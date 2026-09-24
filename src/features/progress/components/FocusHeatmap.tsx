import { Heatmap, HeatmapSwatch } from '@/components/common/Heatmap'
import type { FocusDay } from '@/features/progress/types'
import { useT } from '@/hooks/useT'

interface FocusHeatmapProps {
  /** Days oldest→newest; length should be a multiple of 7 for clean columns. */
  days: FocusDay[]
  /** Desktop: stretch the grid to fill the card width with larger cells. */
  fill?: boolean
}

const INTENSITY = ['bg-foreground/10', 'bg-accent/35', 'bg-accent/65', 'bg-accent'] as const

/** Colour a cell by how long the day's focus ran — four intensity buckets. */
function intensityClass(minutes: number): string {
  if (minutes <= 0) return INTENSITY[0]
  if (minutes < 25) return INTENSITY[1]
  if (minutes < 60) return INTENSITY[2]
  return INTENSITY[3]
}

/** Focus grid: each day shaded by the minutes focused. */
export function FocusHeatmap({ days, fill = false }: FocusHeatmapProps) {
  const { t } = useT()
  return (
    <Heatmap
      days={days}
      fill={fill}
      cellClass={(day) => intensityClass(day.minutes)}
      cellTitle={(day) => t('insights.focusDay', { date: day.date, count: day.minutes })}
      legend={
        <div className="flex items-center gap-1.5">
          <span className="label-mono normal-case tracking-normal">
            {t('insights.heatmapLess')}
          </span>
          {INTENSITY.map((className) => (
            <HeatmapSwatch key={className} className={className} />
          ))}
          <span className="label-mono normal-case tracking-normal">
            {t('insights.heatmapMore')}
          </span>
        </div>
      }
    />
  )
}
