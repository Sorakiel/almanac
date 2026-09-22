import { Trans } from '@/components/common/Trans'
import { weekdayLabels } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

interface WeekdayReadoutProps {
  best: number
  worst: number | null
  className?: string
}

/** "Your most consistent day is … — … is your weak point." */
export function WeekdayReadout({ best, worst, className }: WeekdayReadoutProps) {
  const { t, locale } = useT()
  const days = weekdayLabels(locale, 'long')
  return (
    <div
      className={cn(
        'rounded-card border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-4',
        className,
      )}
    >
      <p className="label-mono text-accent">{t('insights.readout')}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        <Trans
          text={t(worst === null ? 'insights.readoutBest' : 'insights.readoutBestWorst')}
          values={{
            best: <span className="font-medium text-accent">{days[best]}</span>,
            worst: worst === null ? null : <span className="text-foreground">{days[worst]}</span>,
          }}
        />
      </p>
    </div>
  )
}
