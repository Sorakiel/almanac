import type { ReadingInsights } from '@/features/insights/types'
import type { Book } from '@/features/reading/types'
import type { InsightLine } from '@/lib/insight'
import type { TFunction } from '@/hooks/useT'

/**
 * Rule-based reading observations derived from the shelf + reading insights,
 * most-actionable first (a nearly-finished book leads). Feeds the shared
 * InsightTicker on the Reading rail / page.
 */
export function buildReadingLines(
  books: Book[],
  insights: ReadingInsights | null,
  dateKey: string,
  t: TFunction,
  locale: string,
): InsightLine[] {
  if (books.length === 0) return []

  const lines: InsightLine[] = []
  const reading = insights?.currentlyReading ?? []
  // Furthest-along in-progress book with a known length.
  const withPct = reading.filter((b) => b.pct !== null).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
  const closest = withPct[0]

  if (closest && (closest.pct ?? 0) >= 75) {
    lines.push({
      id: 'finish',
      text: t('reading.lines.finish', { title: closest.title, pct: closest.pct ?? 0 }),
      tone: 'urgent',
    })
  } else if (reading.length > 1 && closest) {
    lines.push({
      id: 'furthest',
      text: t('reading.lines.furthest', {
        count: reading.length,
        title: closest.title,
        pct: closest.pct ?? 0,
      }),
      tone: 'info',
    })
  } else if (closest) {
    lines.push({
      id: 'progress',
      text: t('reading.lines.progress', { title: closest.title, pct: closest.pct ?? 0 }),
      tone: 'good',
    })
  } else if (reading.length > 0) {
    lines.push({
      id: 'reading',
      text: t('reading.lines.reading', { count: reading.length }),
      tone: 'info',
    })
  }

  if (insights?.hasData) {
    if (insights.pages30d > 0) {
      lines.push({
        id: 'pages',
        text: t('reading.lines.pages', {
          count: insights.pages30d,
          value: insights.pages30d.toLocaleString(locale),
        }),
        tone: 'good',
      })
    } else if (insights.minutes30d > 0) {
      lines.push({
        id: 'minutes',
        text: t('reading.lines.minutes', { count: insights.minutes30d }),
        tone: 'good',
      })
    }
    if (insights.sessions30d > 0) {
      lines.push({
        id: 'sessions',
        text: t('reading.lines.sessions', { count: insights.sessions30d }),
        tone: 'info',
      })
    }
    if (insights.finishedThisYear > 0) {
      const year = dateKey.slice(0, 4)
      lines.push({
        id: 'finished-year',
        text: t('reading.lines.finishedYear', { count: insights.finishedThisYear, year }),
        tone: 'good',
      })
    }
  }

  if (lines.length === 0) {
    lines.push({
      id: 'shelf',
      text: t('reading.lines.shelf', { count: books.length }),
      tone: 'info',
    })
  }

  return lines
}
