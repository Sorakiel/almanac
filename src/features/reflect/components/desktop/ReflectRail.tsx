import { NotebookPen } from 'lucide-react'
import { ReflectTicker } from '@/features/reflect/components/ReflectTicker'
import { journalStreak } from '@/features/reflect/lib/format'
import type { Reflection } from '@/features/reflect/types'

interface ReflectRailProps {
  reflections: Reflection[]
  /** The user's local date key, for the current-streak calculation. */
  dateKey: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop Reflect context rail: identity + a small journaling snapshot. */
export function ReflectRail({ reflections, dateKey }: ReflectRailProps) {
  const month = dateKey.slice(0, 7)
  const thisMonth = reflections.filter((r) => r.date.startsWith(month)).length
  const streak = journalStreak(new Set(reflections.map((r) => r.date)), dateKey)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-teal/15 text-teal"
        >
          <NotebookPen className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Journal</p>
          <p className="font-mono text-[10px] text-muted-strong">your reflections</p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">snapshot</p>
        <div className="mt-2 flex flex-col">
          <Row label="entries" value={String(reflections.length)} />
          <Row label="this month" value={String(thisMonth)} />
          <Row label="day streak" value={String(streak)} />
        </div>
      </div>

      <ReflectTicker reflections={reflections} dateKey={dateKey} />
    </div>
  )
}
