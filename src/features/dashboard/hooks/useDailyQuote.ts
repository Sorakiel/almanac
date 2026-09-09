import { useQuery } from '@tanstack/react-query'
import { daysBetween } from '@/lib/date'
import { useToday } from '@/hooks/useToday'
import { fetchQuotes, type Quote } from '@/features/dashboard/api/quotes.api'

/** Day-of-year index (1-based) so the quote rotates once per local day, stably. */
function dayOfYear(dateKey: string): number {
  return daysBetween(`${dateKey.slice(0, 4)}-01-01`, dateKey) + 1
}

interface UseDailyQuoteResult {
  quote: Quote | null
  isLoading: boolean
}

/** One quote per day, chosen deterministically from the global set. */
export function useDailyQuote(): UseDailyQuoteResult {
  const { dateKey } = useToday()
  const { data, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
    staleTime: 1000 * 60 * 60,
  })

  const quote = data && data.length > 0 ? (data[dayOfYear(dateKey) % data.length] ?? null) : null

  return { quote, isLoading }
}
