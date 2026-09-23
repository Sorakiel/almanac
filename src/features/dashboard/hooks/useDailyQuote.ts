import { useQuery } from '@tanstack/react-query'
import { daysBetween } from '@/lib/date'
import { useToday } from '@/hooks/useToday'
import { fetchQuotes, type Quote } from '@/features/dashboard/api/quotes.api'
import { localizeQuotes } from '@/features/dashboard/lib/quotes'
import { useT } from '@/hooks/useT'

/** Day-of-year index (1-based) so the quote rotates once per local day, stably. */
function dayOfYear(dateKey: string): number {
  return daysBetween(`${dateKey.slice(0, 4)}-01-01`, dateKey) + 1
}

interface UseDailyQuoteResult {
  quote: Quote | null
  isLoading: boolean
}

/**
 * One quote per day, chosen deterministically from the quotes readable in the
 * interface language.
 */
export function useDailyQuote(): UseDailyQuoteResult {
  const { dateKey } = useToday()
  const { locale } = useT()
  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
    staleTime: 1000 * 60 * 60,
  })

  const readable = data ? localizeQuotes(data, locale) : []
  const quote =
    readable.length > 0 ? (readable[dayOfYear(dateKey) % readable.length] ?? null) : null

  return { quote, isLoading }
}
