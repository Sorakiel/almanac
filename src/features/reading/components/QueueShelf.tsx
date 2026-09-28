import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { BookCover } from '@/features/reading/components/BookCover'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface QueueShelfProps {
  books: Book[]
  onAdd: () => void
}

/** "На очереди" (the prototype's `rShelf`): covers in a row, then "Добавить". */
export function QueueShelf({ books, onAdd }: QueueShelfProps) {
  const { t } = useT()
  return (
    <ul className="no-scrollbar -mx-0.5 flex gap-3.5 overflow-x-auto px-0.5 pb-1.5 pt-1">
      {books.map((book) => (
        <li key={book.id} className="w-[92px] flex-none">
          <Link
            to={`/reading/${book.id}`}
            className="grid gap-1.5 rounded-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <BookCover title={book.title} author={book.author} />
            <span className="line-clamp-2 text-footnote font-medium text-muted">
              <span className="sr-only">{book.title} · </span>
              {book.author ?? t('reading.unknownAuthor')}
            </span>
          </Link>
        </li>
      ))}
      <li className="w-[92px] flex-none">
        <button
          type="button"
          onClick={onAdd}
          className="grid w-full gap-1.5 rounded-inner text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="grid h-[136px] w-[92px] place-items-center rounded-[6px_12px_12px_6px] border-[1.5px] border-dashed border-muted-strong bg-surface text-muted-strong">
            <Plus className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="text-footnote font-medium text-muted">{t('reading.screen.add')}</span>
        </button>
      </li>
    </ul>
  )
}
