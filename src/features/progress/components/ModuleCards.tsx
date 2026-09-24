import { BookOpen, Dumbbell, ListChecks, NotebookPen, Timer } from 'lucide-react'
import { ModuleCard } from '@/features/progress/components/ModuleCard'
import { FocusDetail } from '@/features/progress/components/details/FocusDetail'
import { HabitsDetail } from '@/features/progress/components/details/HabitsDetail'
import { ReadingDetail } from '@/features/progress/components/details/ReadingDetail'
import { ReflectDetail } from '@/features/progress/components/details/ReflectDetail'
import { WorkoutsDetail } from '@/features/progress/components/details/WorkoutsDetail'
import type { ProgressData } from '@/features/progress/hooks/useProgress'
import type { YearDay } from '@/features/progress/lib/yearActivity'
import { durationLabel } from '@/features/progress/lib/verdict'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'

interface ModuleCardsProps {
  data: ProgressData
  yearDays: YearDay[]
  todayKey: string
  /** Days in the period — the denominator for "entries on N of M days". */
  days: number
}

/** One card per module that's switched on, habits first and wide. */
export function ModuleCards({ data, yearDays, todayKey, days }: ModuleCardsProps) {
  const { t, locale } = useT()
  const { habits, workouts, reading, focus, reflect } = data
  const number = (n: number): string => n.toLocaleString(intlLocale(locale))

  return (
    <div className="grid gap-2.5 lg:grid-cols-2 lg:gap-3.5 wide:grid-cols-3">
      {habits?.hasData ? (
        <ModuleCard
          icon={ListChecks}
          tone="accent"
          wide
          title={t('modules.habits.label')}
          summary={t('progress.habitsLine', {
            pct: Math.round(habits.completionRate * 100),
            count: habits.totalDone,
          })}
        >
          <HabitsDetail habits={habits} yearDays={yearDays} todayKey={todayKey} />
        </ModuleCard>
      ) : null}
      {workouts ? (
        <ModuleCard
          icon={Dumbbell}
          tone="teal"
          title={t('modules.workouts.label')}
          summary={t('progress.workoutsLine', {
            count: workouts.sessions,
            kg: number(workouts.volume),
          })}
        >
          <WorkoutsDetail data={workouts} />
        </ModuleCard>
      ) : null}
      {reading ? (
        <ModuleCard
          icon={BookOpen}
          tone="amber"
          title={t('modules.reading.label')}
          summary={[
            t('progress.readingLine', { perDay: reading.perDay }),
            reading.finished > 0 ? t('progress.readingFinished', { count: reading.finished }) : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        >
          <ReadingDetail data={reading} />
        </ModuleCard>
      ) : null}
      {focus ? (
        <ModuleCard
          icon={Timer}
          tone="accent"
          title={t('modules.flow.label')}
          summary={t('progress.focusLine', {
            time: durationLabel(focus.minutes, t),
            count: focus.sessions,
          })}
        >
          <FocusDetail data={focus} />
        </ModuleCard>
      ) : null}
      {reflect ? (
        <ModuleCard
          icon={NotebookPen}
          tone="teal"
          title={t('modules.reflect.label')}
          summary={[
            t('progress.reflectLine', { count: reflect.entries }),
            reflect.rating !== null
              ? t('progress.reflectRating', { rating: number(reflect.rating) })
              : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        >
          <ReflectDetail data={reflect} days={days} />
        </ModuleCard>
      ) : null}
    </div>
  )
}
