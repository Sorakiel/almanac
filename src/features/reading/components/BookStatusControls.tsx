import { toast } from 'sonner'
import { Segmented } from '@/components/ui/segmented'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useBookMutations } from '@/features/reading/hooks/useBookMutations'
import { type BookPatch } from '@/features/reading/api/books.api'
import { useToday } from '@/hooks/useToday'
import type { Book, BookStatus } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/** Shelf status, with the natural start/finish date stamped as it changes. Dates and rating are in Edit. */
export function BookStatusControls({ book }: { book: Book }) {
  const { t } = useT()
  const { update } = useBookMutations()
  const { dateKey } = useToday()

  const setStatus = (status: BookStatus) => {
    const fields: BookPatch = { status }
    // Stamp the natural date as the status changes, without clobbering an
    // existing one the reader may have set by hand.
    if (status === 'reading' && !book.started_on) fields.started_on = dateKey
    if (status === 'finished' && !book.finished_on) fields.finished_on = dateKey
    update.mutate(
      { id: book.id, patch: fields },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.updateFailed')) },
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>{t('reading.status')}</SectionLabel>
      <Segmented
        aria-label={t('reading.statusLabel')}
        value={book.status}
        onChange={setStatus}
        options={[
          { value: 'to_read', label: t('reading.statuses.to_read') },
          { value: 'reading', label: t('reading.statuses.reading') },
          { value: 'finished', label: t('reading.statuses.finished') },
        ]}
      />
    </section>
  )
}
