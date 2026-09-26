import { IconTile } from '@/components/common/IconTile'
import { HabitChecklist } from '@/features/habits/components/HabitChecklist'
import { HabitCalendarCard } from '@/features/habits/components/detail/HabitCalendarCard'
import { HabitDetailActions } from '@/features/habits/components/detail/HabitDetailActions'
import { HabitStreakCard } from '@/features/habits/components/detail/HabitStreakCard'
import { HabitTodayNote } from '@/features/habits/components/detail/HabitTodayNote'
import type { HabitDetailStats } from '@/features/habits/hooks/useHabitDetail'
import { frequencyLabel, timeOfDayLabel } from '@/features/habits/lib/frequency'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { habitHeaderTransition } from '@/features/habits/lib/transition'
import type { Habit } from '@/features/habits/types'
import { useT } from '@/hooks/useT'

export interface HabitDetailHandlers {
  /** Today's count: the goal to mark done, 0 to clear, ±1 for a counted habit. */
  onSetCount: (count: number) => void
  onSaveNote: (note: string) => void
  onToggleFreeze: () => void
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}

interface HabitDetailViewProps extends HabitDetailHandlers {
  habit: Habit
  stats: HabitDetailStats
}

/**
 * One habit, top to bottom: who it is, the run, this month, three numbers,
 * today's checklist, then what can be done to it. The same tree on every
 * width — the desktop inspector reuses it as is.
 */
export function HabitDetailView({ habit, stats, ...handlers }: HabitDetailViewProps) {
  const { t } = useT()
  const Icon = resolveHabitIcon(habit.icon)
  const subtitle = [frequencyLabel(habit, t), timeOfDayLabel(habit.time_of_day, t)]
    .filter(Boolean)
    .join(' · ')

  const numbers = [
    { value: `${stats.ratePct}%`, label: t('habits.detail.rate30') },
    { value: String(stats.best), label: t('habits.detail.bestStreak') },
    { value: String(stats.total), label: t('habits.detail.marksYear') },
  ]

  return (
    <div className="flex flex-col gap-3">
      <header className="mx-0.5 mb-1.5 mt-1.5 flex items-center gap-3.5">
        <IconTile
          icon={Icon}
          tone={resolveHabitColor(habit.color).tile}
          className="h-[60px] w-[60px] rounded-[18px] [&>svg]:h-[30px] [&>svg]:w-[30px]"
        />
        <div className="min-w-0">
          <h1 className="text-title font-bold" style={habitHeaderTransition(habit.id)}>
            {habit.name}
          </h1>
          {subtitle ? <p className="mt-[3px] text-callout text-muted">{subtitle}</p> : null}
          {habit.description ? (
            <p className="mt-1 text-callout text-muted">{habit.description}</p>
          ) : null}
        </div>
      </header>

      <HabitStreakCard
        streak={stats.streak}
        best={stats.best}
        todayDone={stats.todayDone}
        todayFrozen={stats.todayFrozen}
        todayCount={stats.todayCount}
        habit={habit}
        onSetCount={handlers.onSetCount}
      />
      {stats.todayCount > 0 ? (
        <HabitTodayNote
          key={`${habit.id}:${stats.todayKey}`}
          note={stats.todayNote}
          onSave={handlers.onSaveNote}
        />
      ) : null}
      <HabitCalendarCard stats={stats} />

      <dl className="grid grid-cols-3 gap-2">
        {numbers.map((n) => (
          <div key={n.label} className="flex flex-col-reverse rounded-2xl bg-surface p-3">
            <dt className="text-[12.5px] text-muted">{n.label}</dt>
            <dd className="num text-[20px] font-medium tracking-[-0.03em]">{n.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-[10px] flex flex-col gap-[22px]">
        <HabitChecklist habit={habit} />
        <HabitDetailActions
          canFreeze={!stats.todayDone}
          frozen={stats.todayFrozen}
          onToggleFreeze={handlers.onToggleFreeze}
          onEdit={handlers.onEdit}
          onArchive={handlers.onArchive}
          onDelete={handlers.onDelete}
        />
      </div>
    </div>
  )
}
