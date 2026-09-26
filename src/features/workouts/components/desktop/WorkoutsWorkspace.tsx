import { useState } from 'react'
import { Dumbbell, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { RecentSessions } from '@/features/workouts/components/RecentSessions'
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard'
import { WeekStrip } from '@/features/workouts/components/WeekStrip'
import { TodaySessionCard } from '@/features/workouts/components/TodaySessionCard'
import { SessionResumeBanner } from '@/features/workouts/components/SessionResumeBanner'
import { dayStateFor, workoutForDay } from '@/features/workouts/lib/week'
import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import type { WorkoutView } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'

interface WorkoutsWorkspaceProps {
  workouts: WorkoutView[]
  overview: TrainingOverview
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
}

/** Friendly "Monday, 6 July" from a `YYYY-MM-DD` key, UTC-safe, in the UI language. */
function dayLabel(dateKey: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromKey(dateKey))
}

/**
 * Desktop training, the prototype's `.dk-mgrid`: the week, the selected day's
 * session and history on the left; the plan in a sticky 360px column on the
 * right. A workout opens as its own page — the inspector is for habits alone.
 */
export function WorkoutsWorkspace({
  workouts,
  overview,
  isLoading,
  isError,
  refetch,
  onNew,
}: WorkoutsWorkspaceProps) {
  const { t, locale } = useT()
  const [selectedKey, setSelectedKey] = useState(overview.todayKey)
  const selected = workoutForDay(overview.workouts, selectedKey, overview.timezone)

  return (
    <div className="w-full">
      <header>
        <p className="text-callout text-muted">{overview.week.label}</p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-large-title font-bold tracking-title">{t('workouts.title')}</h1>
          <Button onClick={onNew} className="flex-none shadow-glow">
            <Plus className="h-4 w-4" />
            {t('workouts.newWorkout')}
          </Button>
        </div>
      </header>

      {isLoading ? (
        <LoadingState label={t('workouts.loading')} />
      ) : isError ? (
        <ErrorState title={t('workouts.loadFailed')} onRetry={refetch} />
      ) : workouts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Dumbbell}
            title={t('workouts.emptyTitle')}
            description={t('workouts.emptyHint')}
            action={
              <Button size="sm" onClick={onNew}>
                <Plus className="h-4 w-4" />
                {t('workouts.newWorkout')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-module items-start gap-6">
          <div className="grid min-w-0 content-start gap-3.5">
            <Cascade>
              <SessionResumeBanner workouts={overview.workouts} />

              <WeekStrip
                days={overview.week.days}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
              />

              <section className="flex flex-col gap-2">
                <SectionLabel>
                  {selectedKey === overview.todayKey
                    ? t('workouts.todayLower')
                    : dayLabel(selectedKey, intlLocale(locale))}
                </SectionLabel>
                {selected ? (
                  <TodaySessionCard
                    workout={selected.workout}
                    doneToday={selected.done}
                    dayState={dayStateFor(selectedKey, overview.todayKey)}
                  />
                ) : (
                  <div className="rounded-card border border-dashed p-7 text-center">
                    <p className="text-callout text-muted">{t('workouts.restDay')}</p>
                  </div>
                )}
              </section>

              {overview.recent.length > 0 ? (
                <section className="flex flex-col gap-2">
                  <SectionLabel accessory={`${overview.completedCount}`}>
                    {t('workouts.recent')}
                  </SectionLabel>
                  <div className="rounded-card border bg-surface px-4 py-2">
                    <RecentSessions workouts={overview.recent} />
                  </div>
                </section>
              ) : null}
            </Cascade>
          </div>

          <aside
            aria-label={t('workouts.allWorkouts')}
            className="sticky top-toolbar-clearance grid min-w-0 content-start gap-3.5"
          >
            <section className="flex flex-col gap-2">
              <SectionLabel accessory={`${workouts.length}`}>
                {t('workouts.allWorkouts')}
              </SectionLabel>
              {workouts.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
