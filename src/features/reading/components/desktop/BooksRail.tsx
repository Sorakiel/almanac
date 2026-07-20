import { BookOpen } from 'lucide-react'
import { BookTicker } from '@/features/reading/components/BookTicker'
import { libraryStats } from '@/features/reading/lib/library'
import { useToday } from '@/hooks/useToday'
import type { Book } from '@/features/reading/types'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop Reading context rail: identity + a library snapshot. */
export function BooksRail({ books }: { books: Book[] }) {
  const { dateKey } = useToday()
  const stats = libraryStats(books, dateKey)
  const year = dateKey.slice(0, 4)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-amber/15 text-amber"
        >
          <BookOpen className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Library</p>
          <p className="font-mono text-[10px] text-muted-strong">your shelf</p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">snapshot</p>
        <div className="mt-2 flex flex-col">
          <Row label="books" value={String(stats.total)} />
          <Row label="reading" value={String(stats.reading)} />
          <Row label="finished" value={String(stats.finished)} />
          <Row label={`finished ${year}`} value={String(stats.finishedThisYear)} />
        </div>
      </div>

      <BookTicker books={books} />
    </div>
  )
}
