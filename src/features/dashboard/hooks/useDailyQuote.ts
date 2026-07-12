import { useQuery } from '@tanstack/react-query'
import { useToday } from '@/hooks/useToday'
import { fetchQuotes, type Quote } from '@/features/dashboard/api/quotes.api'

/** Day-of-year index so the quote rotates once per local day, stably. */
function dayOfYear(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  const start = Date.UTC(y ?? 1970, 0, 0)
  const now = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  return Math.floor((now - start) / 86_400_000)
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
