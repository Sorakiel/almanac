import { parseISO } from 'date-fns'
import { Check, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/i18n/types'
import type { Habit } from '@/features/habits/types'
import type { HabitDetailStats } from '@/features/habits/hooks/useHabitDetail'
import type { DayStatus } from '@/features/habits/lib/schedule'
import { useT } from '@/hooks/useT'

/** Glyph + tone + label *key* for each history-row status. Rest days read
 *  neutral, never as a miss — key for interval/weekday cadences. The label is a
 *  key rather than a string because a label resolved at module scope stops
 *  updating when the language changes. */
const STATUS_META: Record<DayStatus, { labelKey: TranslationKey; glyph: string; tone: string }> = {
  done: { labelKey: 'habits.legendDone', glyph: '✓', tone: 'text-accent' },
  frozen: { labelKey: 'habits.legendFrozen', glyph: '❄', tone: 'text-teal' },
  due: { labelKey: 'habits.rail.statusToday', glyph: '○', tone: 'text-foreground' },
  missed: { labelKey: 'habits.legendMissed', glyph: '○', tone: 'text-muted-strong' },
  rest: { labelKey: 'habits.legendRest', glyph: '·', tone: 'text-muted-strong' },
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
  const { t, locale } = useT()
  // Newest-first, last five days of the window.
  const recent = [...stats.heatmap].slice(-5).reverse()
  const dayFormatter = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })

  return (
    <div className="flex min-h-full flex-col gap-6">
      {habit.description ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
            {t('habits.rail.notes')}
          </p>
          <p className="mt-3 rounded-r-2xl border-l-2 border-accent bg-surface px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground/85">
            {habit.description}
          </p>
        </div>
      ) : null}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {t('habits.rail.recent')}
        </p>
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
                  {dayFormatter.format(parseISO(day.date))}
                </span>
                <span className="font-mono text-[10px] text-muted-strong">{t(meta.labelKey)}</span>
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
            {stats.todayFrozen ? t('habits.frozenToday') : t('habits.freezeToday')}
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
          {stats.todayDone ? t('habits.completedToday') : t('habits.markDone')}
        </Button>
      </div>
    </div>
  )
}
