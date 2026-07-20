import { Pencil, Trash2 } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { HabitHeatmap } from '@/features/habits/components/HabitHeatmap'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { frequencyLabel, timeOfDayLabel } from '@/features/habits/lib/frequency'
import type { Habit } from '@/features/habits/types'
import type { HabitDetailStats } from '@/features/habits/hooks/useHabitDetail'

interface HabitDetailWorkspaceProps {
  habit: Habit
  stats: HabitDetailStats
  onEdit: () => void
  onDelete: () => void
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-2xl border bg-panel px-5 py-[18px]">
      <p className="font-mono text-[9px] uppercase tracking-label text-muted-strong">{label}</p>
      <p
        className={`mt-1 text-[28px] font-semibold tabular-nums tracking-title ${accent ? 'text-accent' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

/** Desktop habit-detail workspace: identity header, stat tiles, year heatmap. */
export function HabitDetailWorkspace({
  habit,
  stats,
  onEdit,
  onDelete,
}: HabitDetailWorkspaceProps) {
  const color = resolveHabitColor(habit.color)
  const Icon = resolveHabitIcon(habit.icon)
  const subtitle = [frequencyLabel(habit), habit.description, timeOfDayLabel(habit.time_of_day)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <header className="flex items-center gap-4">
        <IconTile icon={Icon} tone={color.tile} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[32px] leading-tight tracking-title">{habit.name}</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-label text-muted-strong">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[11px] border px-3.5 py-[9px] font-mono text-xs text-muted transition-colors hover:text-foreground"
        >
          <Pencil className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete habit"
          className="rounded-[11px] border p-[11px] text-muted-strong transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="mt-6 flex gap-3.5">
        <Stat label="streak" value={`◆ ${stats.streak}d`} accent />
        <Stat label="best" value={`${stats.best}d`} />
        <Stat label="rate" value={`${stats.ratePct}%`} />
        <Stat label="total" value={String(stats.total)} />
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <SectionLabel>LAST 12 MONTHS</SectionLabel>
        <HabitHeatmap days={stats.heatmap} createdKey={stats.createdKey} fill />
      </div>
    </div>
  )
}
