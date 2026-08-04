import { useMemo, type ReactElement } from 'react'
import { InsightTicker } from '@/components/common/InsightTicker'
import { useReadingInsights } from '@/features/insights/hooks/useReadingInsights'
import { buildReadingLines } from '@/features/reading/lib/insightLines'
import { useToday } from '@/hooks/useToday'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface BookTickerProps {
  books: Book[]
}

/** Reading readout — the shared ticker fed by the reading line generator. */
export function BookTicker({ books }: BookTickerProps): ReactElement | null {
  const { t } = useT()
  const { data } = useReadingInsights()
  const { dateKey } = useToday()
  const lines = useMemo(() => buildReadingLines(books, data, dateKey), [books, data, dateKey])
  return <InsightTicker title={t('reading.tickerTitle')} lines={lines} />
}
