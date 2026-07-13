import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/common/StarRating'
import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'
import { useReflectionMutations } from '@/features/reflect/hooks/useReflectionMutations'
import type { Reflection } from '@/features/reflect/types'

interface ReflectionComposerProps {
  /** The user's local date key — the day this entry belongs to. */
  dateKey: string
  /** Today's existing reflection, or null to compose a fresh one. */
  today: Reflection | null
}

const RATINGS = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'day_rating', label: 'Day' },
] as const

/** Today's entry: quote of the day, mood/energy/day ratings, and a reflection. */
export function ReflectionComposer({ dateKey, today }: ReflectionComposerProps) {
  const { quote } = useDailyQuote()
  const { save } = useReflectionMutations()
  const [body, setBody] = useState(today?.body ?? '')
  const [mood, setMood] = useState<number | null>(today?.mood ?? null)
  const [energy, setEnergy] = useState<number | null>(today?.energy ?? null)
  const [day, setDay] = useState<number | null>(today?.day_rating ?? null)

  const setters = { mood: setMood, energy: setEnergy, day_rating: setDay } as const
  const values = { mood, energy, day_rating: day }

  const trimmed = body.trim()
  const changed =
    trimmed !== (today?.body ?? '') ||
    mood !== (today?.mood ?? null) ||
    energy !== (today?.energy ?? null) ||
    day !== (today?.day_rating ?? null)
  const hasContent = trimmed.length > 0 || mood !== null || energy !== null || day !== null

  const handleSave = () => {
    save.mutate(
      {
        id: today?.id ?? null,
        date: dateKey,
        body: trimmed,
        quoteId: today?.quote_id ?? quote?.id ?? null,
        mood,
        energy,
        dayRating: day,
      },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not save your reflection'),
      },
    )
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
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

      <div className="flex flex-col gap-2.5">
        {RATINGS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="label-mono text-muted-strong">{label}</span>
            <StarRating
              value={values[key]}
              onChange={setters[key]}
              size="md"
              aria-label={`${label} rating`}
            />
          </div>
        ))}
      </div>

      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What stood out today? A win, a lesson, a feeling…"
        aria-label="Today's reflection"
        rows={4}
      />

      <div className="flex items-center justify-between">
        <span className="label-mono text-muted-strong">{today ? 'saved today' : 'today'}</span>
        <Button size="sm" onClick={handleSave} disabled={!hasContent || !changed || save.isPending}>
          {today ? 'Update' : 'Save'}
        </Button>
      </div>
    </Card>
  )
}
