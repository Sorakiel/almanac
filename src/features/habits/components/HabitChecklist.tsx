import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { useHabitSubtasks } from '@/features/habits/hooks/useHabitSubtasks'
import type { Habit } from '@/features/habits/types'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface HabitChecklistProps {
  habit: Habit
}

/** Today's checklist for a habit. Checking every item marks the habit done
 *  (and unchecking any one un-marks it) — same as any nested-task list.
 *  Renders nothing when the habit has no checklist. */
export function HabitChecklist({ habit }: HabitChecklistProps) {
  const { t } = useT()
  const { subtasks, isLoading, toggleToday, todayKey } = useHabitSubtasks(habit)

  if (isLoading || subtasks.length === 0) return null

  const done = subtasks.filter((s) => s.completed_dates.includes(todayKey)).length

  return (
    <section>
      <h2 className="mx-1 mb-2 flex items-baseline justify-between text-[20px] font-semibold tracking-[-0.015em]">
        {t('habits.detail.checklist')}
        <span className="text-callout font-normal tracking-normal text-muted">
          {t('habits.detail.ofTotal', { done, total: subtasks.length })}
        </span>
      </h2>
      <ul className="overflow-hidden rounded-card bg-surface">
        {subtasks.map((subtask) => {
          const checked = subtask.completed_dates.includes(todayKey)
          const toggle = () =>
            toggleToday.mutate(
              { subtask, checked: !checked },
              {
                onError: (error) => toast.error(toUserError(error, t, 'habits.itemUpdateFailed')),
              },
            )
          return (
            <li
              key={subtask.id}
              className="relative flex min-h-[60px] items-center gap-3 pl-2 pr-3.5 [&+&]:before:absolute [&+&]:before:left-[60px] [&+&]:before:right-0 [&+&]:before:top-0 [&+&]:before:h-px [&+&]:before:bg-foreground/10"
            >
              <button
                type="button"
                onClick={toggle}
                aria-pressed={checked}
                aria-label={
                  checked
                    ? t('habits.aria.uncheck', { name: subtask.title })
                    : t('habits.aria.check', { name: subtask.title })
                }
                className="grid h-11 w-11 flex-none place-items-center rounded-full"
              >
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full border-2 transition-colors',
                    checked ? 'border-accent bg-accent' : 'border-foreground/35',
                  )}
                >
                  <Check
                    aria-hidden="true"
                    strokeWidth={3}
                    className={cn(
                      'h-4 w-4 text-on-accent-solid',
                      checked ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </span>
              </button>
              <span className={cn('min-w-0 flex-1 truncate text-body', checked && 'text-muted')}>
                {subtask.title}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
