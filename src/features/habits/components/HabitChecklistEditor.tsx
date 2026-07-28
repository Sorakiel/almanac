import { toast } from 'sonner'
import { ChecklistEditorShell } from '@/features/habits/components/ChecklistEditorShell'
import { useHabitSubtasks } from '@/features/habits/hooks/useHabitSubtasks'
import type { Habit } from '@/features/habits/types'

interface HabitChecklistEditorProps {
  habit: Habit
}

/** Add/remove rows for a habit's checklist — shown only when editing (an
 *  existing habit is required, since each row is FK'd to it). */
export function HabitChecklistEditor({ habit }: HabitChecklistEditorProps) {
  const { subtasks, add, remove } = useHabitSubtasks(habit)

  return (
    <ChecklistEditorShell
      items={subtasks.map((s) => ({ id: s.id, title: s.title }))}
      addPending={add.isPending}
      onAdd={(title) =>
        add.mutate(title, {
          onError: (error) =>
            toast.error(error instanceof Error ? error.message : 'Could not add item'),
        })
      }
      onRemove={(id) =>
        remove.mutate(id, {
          onError: (error) =>
            toast.error(error instanceof Error ? error.message : 'Could not remove item'),
        })
      }
    />
  )
}
