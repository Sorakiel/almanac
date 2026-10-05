import { useMemo } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/common/Skeleton'
import {
  almanacMonths,
  type AlmanacCell,
  type AlmanacLevel,
} from '@/features/profile/lib/almanacGrid'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface AlmanacGridProps {
  grid: AlmanacCell[][]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  className?: string
}

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

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
  const { t } = useT()

  // Every month the half-year touches, spread evenly under the grid — the
  // prototype's `.pf-months` (апр май июн июл авг сент).
  const months = useMemo(() => almanacMonths(grid), [grid])

  return (
    <section
      className={cn('rounded-card bg-surface p-3.5', className)}
      aria-label={t('profile.almanac')}
    >
      <div className="mx-0.5 mb-2.5 flex items-baseline justify-between">
        <h2 className="text-body font-semibold">{t('profile.almanac')}</h2>
        <span className="text-footnote text-muted">{t('profile.halfYear')}</span>
      </div>
      {isError ? (
        <ErrorState title={t('profile.almanacLoadFailed')} onRetry={onRetry} />
      ) : isLoading ? (
        <Skeleton className="h-20 w-full rounded-inner" />
      ) : (
        <>
          <div
            role="img"
            aria-label={t('profile.almanacAria')}
            className="grid grid-flow-col grid-rows-7 justify-between gap-0.75"
          >
            {grid.flatMap((week) =>
              week.map((cell) => (
                <i
                  key={cell.date}
                  className={cn(
                    'block h-2.25 w-2.25 rounded-cell',
                    cell.future ? 'bg-transparent' : LEVEL[cell.level],
                    cell.today && 'outline outline-1.5 outline-offset-1 outline-foreground',
                  )}
                />
              )),
            )}
          </div>
          <div
            className="mx-0.5 mt-1.5 flex justify-between text-caption text-muted-strong"
            aria-hidden="true"
          >
            {months.map((m) => (
              <span key={m}>{t(`profile.monthsShort.${MONTH_KEYS[m] ?? 'jan'}`)}</span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
