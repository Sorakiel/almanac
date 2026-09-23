import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useNoteMutations } from '@/features/reading/hooks/useNoteMutations'
import type { Book, BookNote } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/** Book notes: a composer (body + optional page) and the note history. */
export function NotesSection({ book, notes }: { book: Book; notes: BookNote[] }) {
  const { t } = useT()
  const { add, remove } = useNoteMutations(book.id)
  const [body, setBody] = useState('')
  const [page, setPage] = useState('')

  const onAdd = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    const parsed = page ? Number.parseInt(page, 10) : NaN
    add.mutate(
      { bookId: book.id, body: trimmed, page: Number.isFinite(parsed) ? parsed : null },
      {
        onSuccess: () => {
          setBody('')
          setPage('')
        },
        onError: (error) => toast.error(toUserError(error, t, 'reading.noteAddFailed')),
      },
    )
  }

  const onDelete = (id: string) => {
    remove.mutate(id, {
      onError: (error) => toast.error(toUserError(error, t, 'reading.noteDeleteFailed')),
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={notes.length > 0 ? `${notes.length}` : undefined}>
        {t('reading.notes')}
      </SectionLabel>

      <Card className="flex flex-col gap-3 p-4">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('reading.notePlaceholder')}
          aria-label={t('reading.newNote')}
          rows={3}
        />
        <div className="flex items-end gap-2">
          <label className="flex w-28 flex-col gap-1.5">
            <span className="label-mono">{t(`reading.notePosition.${book.progress_mode}`)}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={page}
              onChange={(event) => setPage(event.target.value)}
            />
          </label>
          <Button className="ml-auto" onClick={onAdd} disabled={add.isPending || !body.trim()}>
            {t('reading.addNote')}
          </Button>
        </div>
      </Card>

      {notes.length > 0
        ? notes.map((note) => (
            <Card key={note.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="label-mono text-muted-strong">
                  {note.page !== null
                    ? t(`reading.noteAt.${book.progress_mode}`, { n: note.page })
                    : t('reading.noteLabel')}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
                  disabled={remove.isPending}
                  aria-label={t('reading.deleteNote')}
                  className="flex-none text-muted-strong transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-callout">{note.body}</p>
            </Card>
          ))
        : null}
    </section>
  )
}
