import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useHabitSubtasks } from '@/features/habits/hooks/useHabitSubtasks'

interface HabitChecklistEditorProps {
  habitId: string
}

/** Add/remove rows for a habit's optional checklist — shown only when editing. */
export function HabitChecklistEditor({ habitId }: HabitChecklistEditorProps) {
  const { subtasks, isLoading, add, remove } = useHabitSubtasks(habitId)
  const [title, setTitle] = useState('')

  const handleAdd = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    add.mutate(trimmed, {
      onSuccess: () => setTitle(''),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Could not add item'),
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <span className="label-mono">Checklist</span>

      {!isLoading && subtasks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center gap-2 rounded-tile bg-bg-deep px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{subtask.title}</span>
              <button
                type="button"
                aria-label={`Remove ${subtask.title}`}
                onClick={() =>
                  remove.mutate(subtask.id, {
                    onError: (error) =>
                      toast.error(error instanceof Error ? error.message : 'Could not remove item'),
                  })
                }
                className="flex h-6 w-6 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:text-accent"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Add a checklist item"
          aria-label="New checklist item"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!title.trim() || add.isPending}
          aria-label="Add item"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-tile bg-accent/15 text-accent transition-colors hover:bg-accent hover:text-on-accent disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
