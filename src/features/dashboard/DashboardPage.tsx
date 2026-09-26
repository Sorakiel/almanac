import { ErrorState } from '@/components/common/ErrorState'
import { DayRings } from '@/features/dashboard/components/DayRings'
import { TodayDoneDisclosure } from '@/features/dashboard/components/TodayDoneDisclosure'
import { TodayHabitList } from '@/features/dashboard/components/TodayHabitList'
import { TodayHeader } from '@/features/dashboard/components/TodayHeader'
import { TodayNudge } from '@/features/dashboard/components/TodayNudge'
import { TodaySkeleton } from '@/features/dashboard/components/TodaySkeleton'
import { TodayModules } from '@/features/dashboard/components/modules/TodayModules'
import { useFocusToday } from '@/features/dashboard/hooks/useFocusToday'
import { useTodayToggle } from '@/features/dashboard/hooks/useTodayToggle'
import { nudgeHabit, planToday } from '@/features/dashboard/lib/todayGroups'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useDayCompletionBeacon } from '@/features/social/hooks/useDayCompletionBeacon'
import { useTodaysWorkouts } from '@/features/workouts/hooks/useTodaysWorkouts'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { useModulesStore } from '@/stores/modules'
import '@/features/dashboard/today.css'

/** The focus ring fills at this many minutes a day — the prototype's two blocks of 25. */
const FOCUS_GOAL_MIN = 50

/**
 * Today: what is left to do now, in the order the day runs. Rings for the day
 * at a glance, one nudge when a streak is about to break, the habits still
 * open by time of day, the enabled modules' one action each, and what is done
 * folded away at the bottom. Phone and desktop are one tree — see today.css.
 */
function DashboardPage() {
  const { t } = useT()
  const { user } = useSession()
  const { profile } = useProfile()
  const { dateKey } = useToday()
  const { habits, isLoading, isError, refetch } = useHabits()
  const enabled = useModulesStore((s) => s.enabled)
  const { due: workouts } = useTodaysWorkouts()
  const focusMinutes = useFocusToday(enabled.flow)
  const { phases, onToggle, onSkip } = useTodayToggle(habits)

  const plan = planToday(habits, new Set(phases.keys()))
  const completed = habits.filter((h) => h.isComplete).length
  const nudge = nudgeHabit(habits)

  // Publish a "closed the day" event for the friends feed once all due habits
  // are done (idempotent no-op if there are no friends / already emitted).
  useDayCompletionBeacon(completed, plan.dueCount, dateKey)

  if (isError) return <ErrorState title={t('dashboard.loadFailed')} onRetry={refetch} />
  if (isLoading) return <TodaySkeleton />

  const name = profile?.display_name?.trim() || user?.email || ''

  return (
    <div className="today">
      <TodayHeader name={name} />

      <div className="today-layout">
        <div className="today-col">
          {nudge ? (
            <div className="today-o-nudge">
              <TodayNudge habit={nudge} onMark={onToggle} />
            </div>
          ) : null}
          <div className="today-o-habits">
            <TodayHabitList
              plan={plan}
              habitCount={habits.length}
              phases={phases}
              onToggle={onToggle}
              onSkip={onSkip}
            />
          </div>
          {plan.done.length > 0 ? (
            <div className="today-o-done">
              <TodayDoneDisclosure habits={plan.done} onToggle={onToggle} onSkip={onSkip} />
            </div>
          ) : null}
        </div>

        <div className="today-aside">
          {plan.dueCount > 0 ? (
            <div className="today-o-rings">
              <DayRings
                habits={{ value: completed, total: plan.dueCount }}
                training={
                  enabled.workouts && workouts.length > 0
                    ? { value: workouts.filter((w) => w.doneToday).length, total: workouts.length }
                    : null
                }
                focus={enabled.flow ? { value: focusMinutes, total: FOCUS_GOAL_MIN } : null}
              />
            </div>
          ) : null}
          <div className="today-o-modules">
            <TodayModules />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
