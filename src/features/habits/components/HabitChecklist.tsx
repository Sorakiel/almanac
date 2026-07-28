import { toast } from 'sonner'
import { CompletionToggle } from '@/components/common/CompletionToggle'
import { useHabitSubtasks } from '@/features/habits/hooks/useHabitSubtasks'
import type { Habit } from '@/features/habits/types'
import { cn } from '@/lib/utils'

interface HabitChecklistProps {
  habit: Habit
}

/** Today's checklist for a habit. Checking every item marks the habit done
 *  (and unchecking any one un-marks it) — same as any nested-task list. */
export function HabitChecklist({ habit }: HabitChecklistProps) {
  const { subtasks, isLoading, toggleToday, todayKey } = useHabitSubtasks(habit)

  if (isLoading || subtasks.length === 0) return null

  const done = subtasks.filter((s) => s.completed_dates.includes(todayKey)).length

  return (
    <div>
      <p className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-label text-muted-strong">
        checklist
        <span className="tabular-nums">
          {done}/{subtasks.length}
        </span>
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {subtasks.map((subtask) => {
          const checked = subtask.completed_dates.includes(todayKey)
          const toggle = () =>
            toggleToday.mutate(
              { subtask, checked: !checked },
              {
                onError: (error) =>
                  toast.error(error instanceof Error ? error.message : 'Could not update item'),
              },
            )
          return (
            <li
              key={subtask.id}
              className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-2.5"
            >
              <CompletionToggle
                done={checked}
                onToggle={toggle}
                size="sm"
                aria-label={checked ? `Uncheck ${subtask.title}` : `Check ${subtask.title}`}
              />
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'min-w-0 flex-1 truncate text-left text-[13px]',
                  checked && 'text-muted line-through',
                )}
              >
                {subtask.title}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
