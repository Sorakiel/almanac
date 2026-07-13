import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { reflectionDateLabel } from '@/features/reflect/lib/format'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Quote } from '@/features/dashboard/api/quotes.api'
import type { Reflection } from '@/features/reflect/types'

interface ReflectionCardProps {
  reflection: Reflection
  /** The quote paired to this entry, resolved by the page (may be null). */
  quote: Quote | null
}

/** One past reflection: its day, body, and the quote it was written against. */
export function ReflectionCard({ reflection, quote }: ReflectionCardProps) {
  const { remove } = useReflectionMutations()

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
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{reflection.body}</p>
      {quote ? (
        <p className="label-mono text-muted-strong/80">◇ {quote.author ?? 'Unknown'}</p>
      ) : null}
    </Card>
  )
}
