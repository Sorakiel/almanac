import { Card } from '@/components/ui/card'
import { useDailyQuote } from '@/features/dashboard/hooks/useDailyQuote'

/** Rotating daily quote. Renders nothing until a quote is available. */
export function QuoteCard() {
  const { quote, isLoading } = useDailyQuote()

  if (isLoading) {
    return <Card className="h-24 animate-pulse bg-surface/60" aria-hidden="true" />
  }
  if (!quote) return null

  return (
    <Card className="flex flex-col gap-3">
      <p className="label-mono">// today</p>
      <blockquote className="text-base leading-relaxed">“{quote.text}”</blockquote>
      {quote.author ? <cite className="text-sm not-italic text-muted">— {quote.author}</cite> : null}
    </Card>
  )
}
