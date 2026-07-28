import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { useHabitSubtasks } from '@/features/habits/hooks/useHabitSubtasks'
import { cn } from '@/lib/utils'

interface HabitChecklistProps {
  habitId: string
}

/** Today's checklist for a habit — a memory aid, not a gate on completion. */
export function HabitChecklist({ habitId }: HabitChecklistProps) {
  const { subtasks, isLoading, toggleToday, todayKey } = useHabitSubtasks(habitId)

  if (isLoading || subtasks.length === 0) return null

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">checklist</p>
      <ul className="mt-3 flex flex-col gap-2">
        {subtasks.map((subtask) => {
          const checked = subtask.completed_dates.includes(todayKey)
          return (
            <li key={subtask.id}>
              <button
                type="button"
                aria-pressed={checked}
                onClick={() =>
                  toggleToday.mutate(
                    { subtask, checked: !checked },
                    {
                      onError: (error) =>
                        toast.error(error instanceof Error ? error.message : 'Could not update item'),
                    },
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-left transition-colors hover:bg-surface/70"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-5 w-5 flex-none items-center justify-center rounded-md border transition-colors',
                    checked
                      ? 'border-transparent bg-accent-solid text-on-accent-solid'
                      : 'border-border text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className={cn('flex-1 text-[13px]', checked && 'text-muted line-through')}>
                  {subtask.title}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
