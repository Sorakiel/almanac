import { ChecklistEditorShell } from '@/features/habits/components/ChecklistEditorShell'

interface HabitChecklistDraftEditorProps {
  items: string[]
  onChange: (items: string[]) => void
}

/** Checklist editor for the "new habit" form — the habit doesn't exist yet,
 *  so rows stay in local state and are bulk-created once it does. */
export function HabitChecklistDraftEditor({ items, onChange }: HabitChecklistDraftEditorProps) {
  return (
    <ChecklistEditorShell
      items={items.map((title, index) => ({ id: String(index), title }))}
      onAdd={(title) => onChange([...items, title])}
      onRemove={(id) => onChange(items.filter((_, index) => String(index) !== id))}
    />
  )
}
