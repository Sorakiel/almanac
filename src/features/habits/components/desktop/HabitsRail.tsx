import { IconTile } from '@/components/common/IconTile'
import { AlmanacNarrator } from '@/features/dashboard/components/AlmanacNarrator'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface HabitsRailProps {
  habits: HabitWithTodayLog[]
}

/** Desktop "Habits" context rail: week summary, strongest, needs attention. */
export function HabitsRail({ habits }: HabitsRailProps) {
  if (habits.length === 0) return null

  const weekRate = Math.round((habits.reduce((s, h) => s + h.rate, 0) / habits.length) * 100)
  const sorted = [...habits].sort((a, b) => b.rate - a.rate)
  const strongest = sorted[0]!
  const StrongIcon = resolveHabitIcon(strongest.icon)
  const strongColor = resolveHabitColor(strongest.color)

  return (
    <div className="flex flex-col gap-5">
      <AlmanacNarrator habits={habits} />

      <div>
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          this week
        </p>
        <div className="mt-3.5 flex gap-3">
          <div className="flex-1 rounded-2xl border bg-surface p-4">
            <p className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
              completion
            </p>
            <p className="mt-1 text-[26px] font-semibold text-accent">{weekRate}%</p>
          </div>
          <div className="flex-1 rounded-2xl border bg-surface p-4">
            <p className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
              active
            </p>
            <p className="mt-1 text-[26px] font-semibold">{habits.length}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          strongest
        </p>
        <div className="mt-2.5 flex items-center gap-3 rounded-2xl border bg-surface p-[15px]">
          <IconTile icon={StrongIcon} tone={strongColor.tile} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{strongest.name}</p>
            <p className="font-mono text-[10px] text-muted-strong">
              {Math.round(strongest.rate * 100)}% · {strongest.completedRecent} of{' '}
              {strongest.windowDays}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
