import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { SectionLabel } from '@/components/common/SectionLabel'
import { StarRating } from '@/components/common/StarRating'
import { useBookMutations } from '@/features/reading/hooks/useBookMutations'
import { useRateBook } from '@/features/reading/hooks/useRateBook'
import { type BookPatch } from '@/features/reading/api/books.api'
import { useToday } from '@/hooks/useToday'
import type { Book, BookStatus } from '@/features/reading/types'

/** Status (with auto start/finish dates), editable dates, and a live rating. */
export function BookStatusControls({ book }: { book: Book }) {
  const { update } = useBookMutations()
  const rate = useRateBook()
  const { dateKey } = useToday()

  const patch = (fields: BookPatch) =>
    update.mutate(
      { id: book.id, patch: fields },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update the book'),
      },
    )

  const onRate = (rating: number | null) =>
    rate.mutate(
      { book, rating },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not save the rating'),
      },
    )

  const setStatus = (status: BookStatus) => {
    const fields: BookPatch = { status }
    // Stamp the natural date as the status changes, without clobbering an
    // existing one the reader may have set by hand.
    if (status === 'reading' && !book.started_on) fields.started_on = dateKey
    if (status === 'finished' && !book.finished_on) fields.finished_on = dateKey
    patch(fields)
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>STATUS</SectionLabel>

      <Segmented
        aria-label="Reading status"
        value={book.status}
        onChange={setStatus}
        options={[
          { value: 'to_read', label: 'To read' },
          { value: 'reading', label: 'Reading' },
          { value: 'finished', label: 'Finished' },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Started</span>
          <Input
            type="date"
            value={book.started_on ?? ''}
            onChange={(event) => patch({ started_on: event.target.value || null })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Finished</span>
          <Input
            type="date"
            value={book.finished_on ?? ''}
            onChange={(event) => patch({ finished_on: event.target.value || null })}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-mono text-muted-strong">Your rating</span>
        <StarRating value={book.rating} onChange={onRate} size="lg" aria-label="Book rating" />
      </div>
    </section>
  )
}
