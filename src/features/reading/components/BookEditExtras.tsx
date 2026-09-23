import { DateField } from '@/components/common/DateField'
import { StarRating } from '@/components/common/StarRating'
import { Input } from '@/components/ui/input'
import type { Book } from '@/features/reading/types'
import type { BookExtras } from '@/features/reading/lib/bookExtras'
import { useT } from '@/hooks/useT'

interface BookEditExtrasProps {
  mode: Book['progress_mode']
  value: BookExtras
  onChange: (value: BookExtras) => void
}

/**
 * The occasional corrections that used to crowd the book page: jump to an
 * exact page, fix the dates, rate it. Saved with the rest of the form.
 */
export function BookEditExtras({ mode, value, onChange }: BookEditExtrasProps) {
  const { t } = useT()
  const set = (patch: Partial<BookExtras>) => onChange({ ...value, ...patch })

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="label-mono">{t(`reading.form.currentUnit.${mode}`)}</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          className="num"
          value={value.current}
          onChange={(event) => set({ current: event.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('reading.started')}</span>
          <DateField value={value.startedOn} onChange={(startedOn) => set({ startedOn })} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('reading.finishedOn')}</span>
          <DateField value={value.finishedOn} onChange={(finishedOn) => set({ finishedOn })} />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-mono">{t('reading.yourRating')}</span>
        <StarRating
          value={value.rating}
          onChange={(rating) => set({ rating })}
          size="lg"
          aria-label={t('reading.ratingLabel')}
        />
      </div>
    </>
  )
}
