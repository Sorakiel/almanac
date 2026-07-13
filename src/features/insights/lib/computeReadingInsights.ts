import { lastNDateKeys } from '@/lib/date'
import { progressPct } from '@/features/reading/lib/progress'
import type { ReadingInsightsData } from '@/features/insights/api/readingInsights.api'
import type { ReadingInsights, ReadingProgressItem } from '@/features/insights/types'

const TOP_N = 5

/**
 * Roll books + reading sessions into reading stats. Pages/minutes/sessions
 * bucket by the last 30 days; "pages" counts units read only for pages-mode
 * books so page and chapter counts aren't mixed.
 */
export function computeReadingInsights(
  data: ReadingInsightsData,
  todayKey: string,
): ReadingInsights {
  const since30 = lastNDateKeys(todayKey, 30)[0]!
  const year = todayKey.slice(0, 4)
  const modeById = new Map(data.books.map((b) => [b.id, b.progress_mode]))

  let pages30d = 0
  let minutes30d = 0
  let sessions30d = 0
  for (const session of data.sessions) {
    if (session.date < since30) continue
    sessions30d += 1
    minutes30d += session.minutes
    if (modeById.get(session.book_id) === 'pages') pages30d += session.units_read
  }

  const currentlyReading: ReadingProgressItem[] = data.books
    .filter((b) => b.status === 'reading')
    .slice(0, TOP_N)
    .map((b) => ({ id: b.id, title: b.title, author: b.author, pct: progressPct(b) }))

  return {
    booksReading: data.books.filter((b) => b.status === 'reading').length,
    booksFinished: data.books.filter((b) => b.status === 'finished').length,
    finishedThisYear: data.books.filter(
      (b) => b.status === 'finished' && b.finished_on?.startsWith(year),
    ).length,
    pages30d,
    minutes30d,
    sessions30d,
    currentlyReading,
    hasData: data.books.length > 0,
  }
}
