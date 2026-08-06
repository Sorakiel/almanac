import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useT } from '@/hooks/useT'

export interface ChecklistRow {
  id: string
  title: string
}

interface ChecklistEditorShellProps {
  items: ChecklistRow[]
  onAdd: (title: string) => void
  onRemove: (id: string) => void
  addPending?: boolean
}

/** Shared add/remove list UI for a habit's checklist — live and draft editors
 *  render the exact same rows, differing only in where the data lives. */
export function ChecklistEditorShell({
  items,
  onAdd,
  onRemove,
  addPending,
}: ChecklistEditorShellProps) {
  const { t } = useT()
  const [title, setTitle] = useState('')

  const handleAdd = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
      <span className="label-mono">
        {t('habits.form.checklist')}
        {items.length > 0 ? ` · ${items.length}` : ''}
      </span>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-tile bg-bg-deep px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
              <button
                type="button"
                aria-label={t('habits.aria.removeItem', { name: item.title })}
                onClick={() => onRemove(item.id)}
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
          placeholder={t('habits.form.checklistPlaceholder')}
          aria-label={t('habits.form.newItem')}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!title.trim() || addPending}
          aria-label={t('habits.form.addItem')}
          className="flex h-10 w-10 flex-none items-center justify-center rounded-tile bg-accent/15 text-accent transition-colors hover:bg-accent hover:text-on-accent disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
