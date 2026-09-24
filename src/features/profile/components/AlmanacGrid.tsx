import { useMemo } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/common/Skeleton'
import type { AlmanacCell, AlmanacLevel } from '@/features/profile/lib/almanacGrid'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface AlmanacGridProps {
  grid: AlmanacCell[][]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  className?: string
}

const LEVEL: Record<AlmanacLevel, string> = {
  0: 'bg-foreground/[0.07]',
  1: 'bg-accent/35',
  2: 'bg-accent/[0.62]',
  3: 'bg-accent',
}

/**
 * "Ваш альманах": 26 weeks of days, one column per week, Monday on top — the
 * brand motif, and the one place the profile shows history rather than totals.
 */
export function AlmanacGrid({ grid, isLoading, isError, onRetry, className }: AlmanacGridProps) {
  const { t, locale } = useT()

  // One label per month, under the week its 1st falls in.
  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', timeZone: 'UTC' })
    return grid.flatMap((week, i) => {
      const first = week.find((c) => c.date.endsWith('-01'))
      return first && i > 0 && i <= grid.length - 3
        ? [{ key: first.date, i, label: fmt.format(dateFromKey(first.date)) }]
        : []
    })
  }, [grid, locale])

  return (
    <section
      className={cn('rounded-card bg-surface p-3.5', className)}
      aria-label={t('profile.almanac')}
    >
      <div className="mx-0.5 mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold">{t('profile.almanac')}</h2>
        <span className="text-footnote text-muted">{t('profile.halfYear')}</span>
      </div>
      {isError ? (
        <ErrorState title={t('profile.almanacLoadFailed')} onRetry={onRetry} />
      ) : isLoading ? (
        <Skeleton className="h-[87px] w-full rounded-inner" />
      ) : (
        <>
          <div
            role="img"
            aria-label={t('profile.almanacAria')}
            className="grid grid-flow-col grid-rows-7 justify-between gap-[3px]"
          >
            {grid.flatMap((week) =>
              week.map((cell) => (
                <i
                  key={cell.date}
                  className={cn(
                    'block h-[9px] w-[9px] rounded-[3px]',
                    cell.future ? 'bg-transparent' : LEVEL[cell.level],
                    cell.today && 'outline outline-[1.5px] outline-offset-1 outline-foreground',
                  )}
                />
              )),
            )}
          </div>
          <div
            className="relative mx-0.5 mt-1.5 h-3.5 text-caption text-muted-strong"
            aria-hidden="true"
          >
            {months.map((m) => (
              <span
                key={m.key}
                className="absolute"
                style={{ left: `${(m.i / grid.length) * 100}%` }}
              >
                {m.label.replace('.', '')}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
