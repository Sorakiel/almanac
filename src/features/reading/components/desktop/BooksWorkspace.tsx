import { BookOpen, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
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
          <LoadingState label={t('reading.loading')} className="py-16" />
        ) : isError ? (
          <ErrorState title={t('reading.loadFailed')} onRetry={refetch} />
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
