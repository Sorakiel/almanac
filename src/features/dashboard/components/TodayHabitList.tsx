import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useT } from '@/hooks/useT'
import { useUiStore } from '@/stores/ui'
import type { HabitWithTodayLog } from '@/features/habits/types'
import type { SettlePhase } from '@/features/dashboard/hooks/useSettlingRows'
import type { TodayPlan } from '@/features/dashboard/lib/todayGroups'
import { TodayHabitGroup } from './TodayHabitGroup'

interface TodayHabitListProps {
  plan: TodayPlan
  /** Every active habit, due today or not — only used to tell "none yet" from "none today". */
  habitCount: number
  phases: ReadonlyMap<string, SettlePhase>
  onToggle: (habit: HabitWithTodayLog) => void
}

/** What is left today, by time of day — or why there is nothing left. */
export function TodayHabitList({ plan, habitCount, phases, onToggle }: TodayHabitListProps) {
  const { t } = useT()
  const openNewHabit = useUiStore((s) => s.openNewHabit)

  if (habitCount === 0) {
    return (
      <EmptyState
        title={t('dashboard.startFirstHabit')}
        description={t('dashboard.startFirstHabitHint')}
        action={
          <Button size="sm" onClick={openNewHabit}>
            <Plus className="h-4 w-4" />
            {t('dashboard.addHabit')}
          </Button>
        }
      />
    )
  }

  if (plan.groups.length === 0) {
    const rest = plan.dueCount === 0
    return (
      <div className="today-big">
        <h3>{rest ? t('dashboard.restDay') : t('dashboard.allClosed')}</h3>
        <p>{rest ? t('dashboard.restDayHint') : t('dashboard.allClosedHint')}</p>
      </div>
    )
  }

  return (
    <>
      {plan.groups.map((group) => (
        <TodayHabitGroup
          key={group.slot}
          slot={group.slot}
          habits={group.habits}
          phases={phases}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}
