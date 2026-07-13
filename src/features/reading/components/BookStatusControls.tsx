import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useBookMutations } from '@/features/reading/hooks/useBookMutations'
import { type BookPatch } from '@/features/reading/api/books.api'
import { useToday } from '@/hooks/useToday'
import { cn } from '@/lib/utils'
import type { Book, BookStatus } from '@/features/reading/types'

/** Status (with auto start/finish dates), editable dates, and a finished rating. */
export function BookStatusControls({ book }: { book: Book }) {
  const { update } = useBookMutations()
  const { dateKey } = useToday()

  const patch = (fields: BookPatch) =>
    update.mutate(
      { id: book.id, patch: fields },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update the book'),
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

      {book.status === 'finished' ? (
        <div className="flex items-center gap-2">
          <span className="label-mono text-muted-strong">Rating</span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Book rating">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (book.rating ?? 0) >= star
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  onClick={() => patch({ rating: book.rating === star ? null : star })}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'fill-amber text-amber' : 'text-muted-strong',
                    )}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
