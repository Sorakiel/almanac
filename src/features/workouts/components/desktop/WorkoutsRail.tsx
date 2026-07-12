import { Dumbbell } from 'lucide-react'
import { summarize } from '@/features/workouts/lib/summary'
import type { WorkoutView } from '@/features/workouts/types'

interface WorkoutsRailProps {
  workouts: WorkoutView[]
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop workouts context rail: identity + a quick training snapshot. */
export function WorkoutsRail({ workouts }: WorkoutsRailProps) {
  const stats = summarize(workouts)
  const rate = stats.total > 0 ? Math.round((100 * stats.completed) / stats.total) : 0

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-teal/15 text-teal"
        >
          <Dumbbell className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Training</p>
          <p className="font-mono text-[10px] text-muted-strong">your sessions</p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">snapshot</p>
        <div className="mt-2 flex flex-col">
          <Row label="sessions" value={String(stats.total)} />
          <Row label="completed" value={String(stats.completed)} />
          <Row label="planned" value={String(stats.planned)} />
          <Row label="done rate" value={`${rate}%`} />
        </div>
      </div>

      <div className="rounded-[16px] border border-teal/25 bg-gradient-to-br from-teal/10 to-transparent p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-teal">next up</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Exercise library and set-by-set logging land in the next update.
        </p>
      </div>
    </div>
  )
}
