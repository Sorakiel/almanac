import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useNoteMutations } from '@/features/reading/hooks/useNoteMutations'
import { unitNoun } from '@/features/reading/lib/progress'
import type { Book, BookNote } from '@/features/reading/types'

/** Book notes: a composer (body + optional page) and the note history. */
export function NotesSection({ book, notes }: { book: Book; notes: BookNote[] }) {
  const { add, remove } = useNoteMutations(book.id)
  const [body, setBody] = useState('')
  const [page, setPage] = useState('')
  const noun = unitNoun(book.progress_mode)

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
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not add the note'),
      },
    )
  }

  const onDelete = (id: string) => {
    remove.mutate(id, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Could not delete the note'),
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={notes.length > 0 ? `${notes.length}` : undefined}>
        NOTES
      </SectionLabel>

      <Card className="flex flex-col gap-3 p-4">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="A quote, an idea, a reaction…"
          aria-label="New note"
          rows={3}
        />
        <div className="flex items-end gap-2">
          <label className="flex w-28 flex-col gap-1.5">
            <span className="label-mono">{noun} (opt.)</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={page}
              onChange={(event) => setPage(event.target.value)}
            />
          </label>
          <Button className="ml-auto" onClick={onAdd} disabled={add.isPending || !body.trim()}>
            Add note
          </Button>
        </div>
      </Card>

      {notes.length > 0
        ? notes.map((note) => (
            <Card key={note.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="label-mono text-muted-strong">
                  {note.page !== null ? `${noun} ${note.page}` : 'note'}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
                  disabled={remove.isPending}
                  aria-label="Delete note"
                  className="flex-none text-muted-strong transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{note.body}</p>
            </Card>
          ))
        : null}
    </section>
  )
}
