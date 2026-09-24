import { useT } from '@/hooks/useT'
import type { HabitWithTodayLog } from '@/features/habits/types'
import type { SettlePhase } from '@/features/dashboard/hooks/useSettlingRows'
import type { TodaySlot } from '@/features/dashboard/lib/todayGroups'
import { TodayHabitRow } from './TodayHabitRow'

interface TodayHabitGroupProps {
  slot: TodaySlot
  habits: HabitWithTodayLog[]
  phases: ReadonlyMap<string, SettlePhase>
  onToggle: (habit: HabitWithTodayLog) => void
}

/** "Morning · 3" and its rows, on one card. */
export function TodayHabitGroup({ slot, habits, phases, onToggle }: TodayHabitGroupProps) {
  const { t } = useT()
  const headingId = `today-${slot}`
  // Rows still folding away were already counted as done.
  const left = habits.filter((h) => !h.isComplete).length

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="today-sec-h">
        {t(`dashboard.slots.${slot}`)}
        <span className="num">{left}</span>
      </h2>
      <div className="today-group">
        {habits.map((habit) => (
          <TodayHabitRow
            key={habit.id}
            habit={habit}
            phase={phases.get(habit.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  )
}
