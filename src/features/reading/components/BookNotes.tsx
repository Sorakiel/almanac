import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useNoteMutations } from '@/features/reading/hooks/useNoteMutations'
import type { Book, BookNote } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface BookNotesProps {
  book: Book
  notes: BookNote[]
  onAdd: () => void
}

/**
 * A book's notes as one group (the prototype's `.m-note` rows): the page in
 * small numbers over the text, and "+ Заметка на странице N" last.
 */
export function BookNotes({ book, notes, onAdd }: BookNotesProps) {
  const { t } = useT()
  const { remove } = useNoteMutations(book.id)
  const mode = book.progress_mode
  return (
    <div className="divide-y divide-foreground/10 overflow-hidden rounded-card bg-surface">
      {notes.map((note) => (
        <div key={note.id} className="group relative px-3.5 py-3">
          {note.page !== null ? (
            <small className="num text-footnote text-muted-strong">
              {t(`reading.noteAt.${mode}`, { n: note.page })}
            </small>
          ) : null}
          <p className="whitespace-pre-wrap pr-7 text-callout">{note.body}</p>
          <button
            type="button"
            onClick={() =>
              remove.mutate(note.id, {
                onError: (error) => toast.error(toUserError(error, t, 'reading.noteDeleteFailed')),
              })
            }
            aria-label={t('reading.deleteNote')}
            className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-inner text-muted-strong opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-[50px] w-full items-center px-4 text-left text-body text-accent transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        {t(`reading.screen.noteAt.${mode}`, { n: book.current_unit })}
      </button>
    </div>
  )
}
