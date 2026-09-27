import { dailyAverage } from '@/features/reading/lib/rhythm'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

// The prototype's `.p-bars` is 56px tall; a bar never quite touches the top.
const CHART_PX = 54
const IDLE_PX = 3

/** "Страниц в день" over two weeks (the prototype's `rStats`), average on the right. */
export function RhythmChart({ perDay }: { perDay: number[] }) {
  const { t } = useT()
  const max = Math.max(1, ...perDay)
  const average = dailyAverage(perDay)
  return (
    <div className="rounded-card bg-surface p-3.5">
      <div className="mx-0.5 mb-2 flex items-baseline justify-between">
        <span className="text-body font-semibold">{t('reading.screen.perDay')}</span>
        <span className="num text-footnote font-medium text-amber">
          {t('reading.screen.average', { count: average })}
        </span>
      </div>
      <div className="flex h-14 items-end gap-1" aria-hidden="true">
        {perDay.map((units, i) => (
          <b
            key={i}
            className={cn(
              'flex-1 rounded-[4px_4px_2px_2px] bg-amber',
              units ? 'opacity-85' : 'opacity-25',
            )}
            style={{ height: units ? Math.max(IDLE_PX, (units / max) * CHART_PX) : IDLE_PX }}
          />
        ))}
      </div>
    </div>
  )
}
