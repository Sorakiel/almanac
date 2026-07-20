import type { ReadingInsights } from '@/features/insights/types'
import type { Book } from '@/features/reading/types'
import type { InsightLine } from '@/lib/insight'

/**
 * Rule-based reading observations derived from the shelf + reading insights,
 * most-actionable first (a nearly-finished book leads). Feeds the shared
 * InsightTicker on the Reading rail / page.
 */
export function buildReadingLines(
  books: Book[],
  insights: ReadingInsights | null,
  dateKey: string,
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
      text: `So close — "${closest.title}" is ${closest.pct}% done. Finish it.`,
      tone: 'urgent',
    })
  } else if (reading.length > 1 && closest) {
    lines.push({
      id: 'furthest',
      text: `${reading.length} books in progress — "${closest.title}" leads at ${closest.pct}%.`,
      tone: 'info',
    })
  } else if (closest) {
    lines.push({
      id: 'progress',
      text: `You're ${closest.pct}% through "${closest.title}".`,
      tone: 'good',
    })
  } else if (reading.length > 0) {
    lines.push({
      id: 'reading',
      text: `${reading.length} book${reading.length > 1 ? 's' : ''} on the go right now.`,
      tone: 'info',
    })
  }

  if (insights?.hasData) {
    if (insights.pages30d > 0) {
      lines.push({
        id: 'pages',
        text: `${insights.pages30d.toLocaleString('en-US')} pages read in the last 30 days.`,
        tone: 'good',
      })
    } else if (insights.minutes30d > 0) {
      lines.push({
        id: 'minutes',
        text: `${insights.minutes30d} minutes of reading logged this month.`,
        tone: 'good',
      })
    }
    if (insights.sessions30d > 0) {
      lines.push({
        id: 'sessions',
        text: `${insights.sessions30d} reading session${insights.sessions30d > 1 ? 's' : ''} this month.`,
        tone: 'info',
      })
    }
    if (insights.finishedThisYear > 0) {
      const year = dateKey.slice(0, 4)
      lines.push({
        id: 'finished-year',
        text: `${insights.finishedThisYear} book${insights.finishedThisYear > 1 ? 's' : ''} finished in ${year}.`,
        tone: 'good',
      })
    }
  }

  if (lines.length === 0) {
    lines.push({
      id: 'shelf',
      text: `${books.length} book${books.length > 1 ? 's' : ''} on your shelf. Pick one up.`,
      tone: 'info',
    })
  }

  return lines
}
