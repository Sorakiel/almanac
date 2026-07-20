import { format, parseISO } from 'date-fns'
import { Check, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Habit } from '@/features/habits/types'
import type { HabitDetailStats } from '@/features/habits/hooks/useHabitDetail'
import type { DayStatus } from '@/features/habits/lib/schedule'

/** Label + glyph + tone for each history-row status. Rest days read neutral,
 *  never as a miss — key for interval/weekday cadences. */
const STATUS_META: Record<DayStatus, { label: string; glyph: string; tone: string }> = {
  done: { label: 'done', glyph: '✓', tone: 'text-accent' },
  frozen: { label: 'frozen', glyph: '❄', tone: 'text-teal' },
  due: { label: 'today', glyph: '○', tone: 'text-foreground' },
  missed: { label: 'missed', glyph: '○', tone: 'text-muted-strong' },
  rest: { label: 'rest', glyph: '·', tone: 'text-muted-strong' },
}

interface HabitDetailRailProps {
  habit: Habit
  stats: HabitDetailStats
  onMarkDone: (done: boolean) => void
  markPending: boolean
  onToggleFreeze: (freeze: boolean) => void
  freezePending: boolean
}

/** Desktop habit-detail rail: notes, recent history, and the mark-done CTA. */
export function HabitDetailRail({
  habit,
  stats,
  onMarkDone,
  markPending,
  onToggleFreeze,
  freezePending,
}: HabitDetailRailProps) {
  // Newest-first, last five days of the window.
  const recent = [...stats.heatmap].slice(-5).reverse()

  return (
    <div className="flex min-h-full flex-col gap-6">
      {habit.description ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
            // notes
          </p>
          <p className="mt-3 rounded-r-2xl border-l-2 border-accent bg-surface px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground/85">
            {habit.description}
          </p>
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">recent</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {recent.map((day) => {
            const meta = STATUS_META[day.status]
            return (
              <li
                key={day.date}
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3',
                  day.status !== 'done' && day.status !== 'due' && 'opacity-60',
                )}
              >
                <span aria-hidden="true" className={cn('text-[13px]', meta.tone)}>
                  {meta.glyph}
                </span>
                <span className="flex-1 text-[13px]">
                  {format(parseISO(day.date), 'EEE · dd MMM')}
                </span>
                <span className="font-mono text-[10px] text-muted-strong">{meta.label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-2">
        {!stats.todayDone ? (
          <Button
            size="lg"
            variant={stats.todayFrozen ? 'primary' : 'surface'}
            className="w-full"
            disabled={freezePending}
            onClick={() => onToggleFreeze(!stats.todayFrozen)}
          >
            <Snowflake className="h-4 w-4" />
            {stats.todayFrozen ? 'Frozen today · undo' : 'Freeze today'}
          </Button>
        ) : null}

        <Button
          size="lg"
          variant={stats.todayDone ? 'surface' : 'primary'}
          className={cn('w-full', !stats.todayDone && !stats.todayFrozen && 'shadow-glow')}
          disabled={markPending}
          onClick={() => onMarkDone(!stats.todayDone)}
        >
          <Check className="h-4 w-4" />
          {stats.todayDone ? 'Completed today' : 'Mark done for today'}
        </Button>
      </div>
    </div>
  )
}
