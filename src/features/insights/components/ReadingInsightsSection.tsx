import { BookOpen } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { InsightStat } from '@/features/insights/components/InsightStat'
import type { ReadingInsights } from '@/features/insights/types'

interface ReadingInsightsSectionProps {
  data: ReadingInsights
}

/** Reading stats block: book/page/time KPIs and the currently-reading list. */
export function ReadingInsightsSection({ data }: ReadingInsightsSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="label-mono">// reading · last 30 days</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightStat label="reading" value={String(data.booksReading)} accent />
        <InsightStat label="finished" value={String(data.booksFinished)} />
        <InsightStat label="pages · 30d" value={String(data.pages30d)} />
        <InsightStat label="time · 30d" value={String(data.minutes30d)} unit="min" />
      </div>

      <div className="rounded-card border bg-surface p-4">
        <p className="label-mono mb-3">currently reading</p>
        {data.currentlyReading.length === 0 ? (
          <p className="text-sm text-muted">No books in progress right now.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {data.currentlyReading.map((book) => (
              <li key={book.id} className="flex items-center gap-3">
                <IconTile icon={BookOpen} tone="bg-amber/15 text-amber" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{book.title}</span>
                  {book.author ? (
                    <span className="block truncate text-[11px] text-muted-strong">
                      {book.author}
                    </span>
                  ) : null}
                </span>
                {book.pct !== null ? (
                  <span className="font-mono text-[11px] text-muted-strong">{book.pct}%</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
