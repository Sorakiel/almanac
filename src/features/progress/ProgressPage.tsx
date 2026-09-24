import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Plus } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { ModuleCards } from '@/features/progress/components/ModuleCards'
import { PeriodSegment } from '@/features/progress/components/PeriodSegment'
import { VerdictCard, type VerdictStat } from '@/features/progress/components/VerdictCard'
import { useProgress } from '@/features/progress/hooks/useProgress'
import { useYearActivity } from '@/features/progress/hooks/useYearActivity'
import { periodDays, periodStart } from '@/features/progress/lib/period'
import { hoursLabel, verdictOf } from '@/features/progress/lib/verdict'
import type { InsightRange } from '@/features/progress/types'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { intlLocale } from '@/lib/dateLocale'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { useUiStore } from '@/stores/ui'

const SUBTITLE = {
  '7d': 'progress.sub7d',
  '30d': 'progress.sub30d',
  all: 'progress.subAll',
} as const

/**
 * Progress (v0.6 §2.5) — replaces Insights. The conclusion first, then one
 * card per module; the phone opens a card's details in place, the desktop
 * shows them all at once.
 */
function ProgressPage() {
  const { t, locale } = useT()
  const navigate = useNavigate()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const { user } = useSession()
  const { profile } = useProfile()
  const { dateKey } = useToday()
  const [range, setRange] = useState<InsightRange>('30d')
  const { data, isLoading, isError, refetch } = useProgress(range)
  const { days: yearDays } = useYearActivity()

  if (isLoading) return <LoadingState label={t('insights.loading')} />
  if (isError) return <ErrorState title={t('insights.loadFailed')} onRetry={refetch} />

  const { habits, workouts, reading, focus, reflect } = data
  const anything = habits?.hasData || workouts || reading || focus || reflect
  if (!anything) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t('insights.emptyTitle')}
        description={t('insights.emptyHint')}
        action={
          <Button
            size="sm"
            onClick={() => {
              navigate('/habits')
              openNewHabit()
            }}
          >
            <Plus className="h-4 w-4" />
            {t('insights.addFirstHabit')}
          </Button>
        }
      />
    )
  }

  const joinedAt = profile?.created_at ?? user?.created_at ?? null
  const joinedKey = joinedAt?.slice(0, 10)
  const days = periodDays(dateKey, periodStart(dateKey, range), joinedKey)
  const joined = joinedAt
    ? new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long' }).format(
        new Date(joinedAt),
      )
    : null
  const verdict = verdictOf(habits, range, t, { days, joined })

  const stats: VerdictStat[] = []
  if (habits?.hasData) {
    stats.push(
      {
        value: `${Math.round(habits.completionRate * 100)}%`,
        label: t('progress.statCompletion'),
        desktopOnly: true,
      },
      { value: String(habits.bestStreak), label: t('progress.statStreak') },
    )
  }
  if (workouts) {
    stats.push({
      value: String(workouts.sessions),
      label: t('progress.statWorkouts', { count: workouts.sessions }),
    })
  }
  if (focus)
    stats.push({
      value: hoursLabel(focus.minutes, t, intlLocale(locale)),
      label: t('progress.statFocus'),
    })
  if (habits?.hasData && stats.filter((s) => !s.desktopOnly).length < 3) {
    stats.push({
      value: String(habits.totalDone),
      label: t('progress.statCheckOffs', { count: habits.totalDone }),
    })
  }

  return (
    <div className="flex flex-col gap-3 lg:mx-auto lg:max-w-5xl lg:gap-3.5">
      <header className="mx-0.5 mb-1 mt-2 lg:mb-3 lg:mt-1 lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div>
          <p className="text-callout font-medium text-muted">{t(SUBTITLE[range])}</p>
          <h1 className="text-large-title font-bold">{t('progress.title')}</h1>
        </div>
        <PeriodSegment value={range} onChange={setRange} className="mt-3 lg:mt-0 lg:w-72" />
      </header>

      <VerdictCard verdict={verdict} stats={stats.slice(0, 4)} />

      <section aria-label={t('progress.byModule')} className="mt-3.5 lg:mt-0">
        <h2 className="mx-1 mb-2 flex items-baseline justify-between text-headline font-semibold lg:hidden">
          {t('progress.byModule')}
          <span className="text-callout font-normal text-muted">{t('progress.tapHint')}</span>
        </h2>
        <ModuleCards data={data} yearDays={yearDays} todayKey={dateKey} days={days} />
      </section>
    </div>
  )
}

export default ProgressPage
