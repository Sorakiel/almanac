import { useId, useState } from 'react'
import { useT } from '@/hooks/useT'

const NOTE_MAX = 280

interface HabitTodayNoteProps {
  note: string | null
  onSave: (note: string) => void
}

/**
 * A line about today's mark ("ran in the rain"). It appears once the day is
 * marked — a note belongs to a mark — and saves when the field is left, so
 * there is no button to find and nothing lost to a stray tap.
 */
export function HabitTodayNote({ note, onSave }: HabitTodayNoteProps) {
  const { t } = useT()
  const id = useId()
  const [draft, setDraft] = useState(note ?? '')

  const save = () => {
    if (draft.trim() !== (note ?? '')) onSave(draft)
  }

  return (
    <div className="grid gap-2 rounded-[22px] bg-surface p-[18px]">
      <label htmlFor={id} className="text-footnote font-medium text-muted">
        {t('habits.detail.note')}
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={NOTE_MAX}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        placeholder={t('habits.detail.notePlaceholder')}
        className="w-full resize-none rounded-control bg-sheet-fill px-3.5 py-3 text-body text-foreground placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      />
    </div>
  )
}
