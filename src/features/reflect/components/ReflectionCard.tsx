import { ChevronDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { RatingBars } from '@/components/common/RatingBars'
import { reflectionDateLabel } from '@/features/reflect/lib/format'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Quote } from '@/features/dashboard/api/quotes.api'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

interface ReflectionCardProps {
  reflection: Reflection
  /** The quote paired to this entry, resolved by the page (may be null). */
  quote: Quote | null
}

/** Rating axes; labels come from `reflect.ratings.*` at render. */
const RATING_LABELS: { key: 'mood' | 'energy' | 'day_rating' }[] = [
  { key: 'mood' },
  { key: 'energy' },
  { key: 'day_rating' },
]

/** One past reflection: its ratings, body, and the quote it was written against. */
export function ReflectionCard({ reflection, quote }: ReflectionCardProps) {
  const { t, locale } = useT()
  const dateLocale = intlLocale(locale)
  const { remove } = useReflectionMutations()
  const ratings = RATING_LABELS.filter((r) => reflection[r.key] !== null)

  const handleDelete = () => {
    remove.mutate(reflection.id, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : t('reflect.deleteFailed')),
    })
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-muted-strong">
          {reflectionDateLabel(reflection.date, dateLocale)}
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={remove.isPending}
          aria-label={t('reflect.deleteAria', {
            date: reflectionDateLabel(reflection.date, dateLocale),
          })}
          className="flex-none text-muted-strong transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {ratings.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ratings.map((r) => (
            <span
              key={r.key}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-strong"
            >
              {t(`reflect.ratings.${r.key}`)}
              <RatingBars
                value={reflection[r.key] as number}
                aria-label={t('reflect.ratingValueAria', {
                  name: t(`reflect.ratings.${r.key}`),
                  value: reflection[r.key] ?? 0,
                })}
              />
            </span>
          ))}
        </div>
      ) : null}
      {reflection.body ? (
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{reflection.body}</p>
      ) : null}
      {quote ? (
        <details className="group -mx-1 mt-0.5">
          <summary className="label-mono focus-visible:ring-ring flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1 py-0.5 text-muted-strong/80 outline-none transition-colors hover:text-foreground focus-visible:ring-2">
            <ChevronDown
              className="h-3 w-3 flex-none transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
            <span className="truncate">◇ {quote.author ?? t('reflect.unknownAuthor')}</span>
          </summary>
          <blockquote className="mt-1.5 border-l-2 border-border pl-3 text-[13px] italic leading-relaxed text-muted-strong">
            {quote.text}
          </blockquote>
        </details>
      ) : null}
    </Card>
  )
}
