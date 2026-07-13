import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Reflection } from '@/features/reflect/types'

interface ReflectionComposerProps {
  /** The user's local date key — the day this entry belongs to. */
  dateKey: string
  /** Today's existing reflection, or null to compose a fresh one. */
  today: Reflection | null
}

/** Today's entry: the quote of the day + a short reflection, create or update. */
export function ReflectionComposer({ dateKey, today }: ReflectionComposerProps) {
  const { quote } = useDailyQuote()
  const { save } = useReflectionMutations()
  const [body, setBody] = useState(today?.body ?? '')

  const trimmed = body.trim()
  const dirty = trimmed.length > 0 && trimmed !== (today?.body ?? '')

  const handleSave = () => {
    save.mutate(
      {
        id: today?.id ?? null,
        date: dateKey,
        body: trimmed,
        // Keep the quote already paired to today's entry; otherwise pair today's.
        quoteId: today?.quote_id ?? quote?.id ?? null,
      },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not save your reflection'),
      },
    )
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      {quote ? (
        <div className="flex gap-2.5 border-b pb-3">
          <span aria-hidden="true" className="text-sm leading-relaxed text-accent">
            ◇
          </span>
          <div>
            <blockquote className="text-[14px] italic leading-relaxed">“{quote.text}”</blockquote>
            <p className="label-mono mt-1 text-muted-strong">— {quote.author ?? 'Unknown'}</p>
          </div>
        </div>
      ) : null}

      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What stood out today? A win, a lesson, a feeling…"
        aria-label="Today's reflection"
        rows={4}
      />

      <div className="flex items-center justify-between">
        <span className="label-mono text-muted-strong">{today ? 'saved today' : 'today'}</span>
        <Button size="sm" onClick={handleSave} disabled={!dirty || save.isPending}>
          {today ? 'Update' : 'Save'}
        </Button>
      </div>
    </Card>
  )
}
