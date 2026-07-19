import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { RatingBars } from '@/components/common/RatingBars'
import { reflectionDateLabel } from '@/features/reflect/lib/format'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Quote } from '@/features/dashboard/api/quotes.api'
import type { Reflection } from '@/features/reflect/types'

interface ReflectionCardProps {
  reflection: Reflection
  /** The quote paired to this entry, resolved by the page (may be null). */
  quote: Quote | null
}

const RATING_LABELS: { key: 'mood' | 'energy' | 'day_rating'; label: string }[] = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'day_rating', label: 'Day' },
]

/** One past reflection: its ratings, body, and the quote it was written against. */
export function ReflectionCard({ reflection, quote }: ReflectionCardProps) {
  const { remove } = useReflectionMutations()
  const ratings = RATING_LABELS.filter((r) => reflection[r.key] !== null)

  const handleDelete = () => {
    remove.mutate(reflection.id, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Could not delete the reflection'),
    })
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-muted-strong">{reflectionDateLabel(reflection.date)}</p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={remove.isPending}
          aria-label={`Delete reflection from ${reflectionDateLabel(reflection.date)}`}
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
              {r.label}
              <RatingBars
                value={reflection[r.key] as number}
                aria-label={`${r.label} ${reflection[r.key]} of 5`}
              />
            </span>
          ))}
        </div>
      ) : null}
      {reflection.body ? (
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{reflection.body}</p>
      ) : null}
      {quote ? (
        <p className="label-mono text-muted-strong/80">◇ {quote.author ?? 'Unknown'}</p>
      ) : null}
    </Card>
  )
}
