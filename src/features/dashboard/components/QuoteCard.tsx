import { Card } from '@/components/ui/card'
import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'
import { useToday } from '@/hooks/useToday'

/** Rotating daily quote. Renders nothing until a quote is available. */
export function QuoteCard() {
  const { quote, isLoading } = useDailyQuote()
  const { dateKey } = useToday()

  if (isLoading) {
    return <Card className="h-24 animate-pulse bg-surface/60" aria-hidden="true" />
  }
  if (!quote) return null

  const [, month, day] = dateKey.split('-')

  return (
    <Card className="flex flex-col gap-3 p-4">
      <blockquote className="text-[15px] italic leading-relaxed">“{quote.text}”</blockquote>
      <p className="label-mono text-muted-strong">
        — {quote.author ?? 'Unknown'} · {month}.{day}
      </p>
    </Card>
  )
}
