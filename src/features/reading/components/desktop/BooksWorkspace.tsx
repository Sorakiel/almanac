import { BookOpen, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { BookShelf } from '@/features/reading/components/BookShelf'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface BooksWorkspaceProps {
  books: Book[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
}

/** Desktop "Reading" workspace — the library grouped by status. */
export function BooksWorkspace({ books, isLoading, isError, refetch, onNew }: BooksWorkspaceProps) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// your shelf</p>
          <h1 className="mt-1.5 text-[44px] leading-none tracking-title">{t('reading.title')}</h1>
          <p className="mt-2 text-[15px] text-muted">{t('reading.subtitle')}</p>
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4" />
          {t('reading.addBook')}
        </Button>
      </header>

      <div className="mt-7">
        {isLoading ? (
          <div className="flex justify-center py-16" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
            <span className="sr-only">{t('reading.loading')}</span>
          </div>
        ) : isError ? (
          <EmptyState
            icon={RefreshCw}
            title={t('reading.loadFailed')}
            description={t('reading.loadFailedHint')}
            action={
              <Button size="sm" variant="surface" onClick={refetch}>
                {t('reading.tryAgain')}
              </Button>
            }
          />
        ) : books.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('reading.emptyTitle')}
            description={t('reading.emptyHint')}
            action={
              <Button size="sm" onClick={onNew}>
                <Plus className="h-4 w-4" />
                {t('reading.addFirstBook')}
              </Button>
            }
          />
        ) : (
          <BookShelf books={books} />
        )}
      </div>
    </div>
  )
}
