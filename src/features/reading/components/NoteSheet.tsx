import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useNoteMutations } from '@/features/reading/hooks/useNoteMutations'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface NoteSheetProps {
  book: Book
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Заметка на странице N": the text, with the page prefilled from where the reader is. */
export function NoteSheet({ book, open, onOpenChange }: NoteSheetProps) {
  const { t } = useT()
  const { add } = useNoteMutations(book.id)
  const [body, setBody] = useState('')
  const [page, setPage] = useState(String(book.current_unit))

  const save = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    const parsed = Number.parseInt(page, 10)
    // Not awaited: the note shows at once; offline it queues.
    add.mutate(
      { bookId: book.id, body: trimmed, page: Number.isFinite(parsed) ? parsed : null },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.noteAddFailed')) },
    )
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('reading.screen.noteSheet')}>
      <div className="flex flex-col gap-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('reading.notePlaceholder')}
          aria-label={t('reading.newNote')}
          rows={4}
        />
        <div className="flex items-end gap-2">
          <label className="flex w-28 flex-col gap-1.5">
            <span className="text-footnote text-muted">
              {t(`reading.screen.notePage.${book.progress_mode}`)}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={page}
              onChange={(event) => setPage(event.target.value)}
            />
          </label>
          <Button className="ml-auto" onClick={save} disabled={!body.trim()}>
            {t('reading.screen.saveNote')}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
