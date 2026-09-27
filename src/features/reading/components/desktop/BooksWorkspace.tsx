import { BookOpen, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Shelf } from '@/features/reading/components/BookShelf'
import { groupBooks } from '@/features/reading/lib/library'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface BooksWorkspaceProps {
  books: Book[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
}

/**
 * Desktop reading, the prototype's `.dk-mgrid`: what is being read and what is
 * finished on the left; the queue in a sticky 360px column on the right. A
 * book opens as its own page — the inspector is for habits alone.
 */
export function BooksWorkspace({ books, isLoading, isError, refetch, onNew }: BooksWorkspaceProps) {
  const { t } = useT()
  const grouped = groupBooks(books)

  return (
    <div className="w-full">
      <header>
        <p className="text-callout text-muted">{t('reading.subtitle')}</p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-large-title font-bold tracking-title">{t('reading.title')}</h1>
          <Button onClick={onNew} className="flex-none shadow-glow">
            <Plus className="h-4 w-4" />
            {t('reading.addBook')}
          </Button>
        </div>
      </header>

      {isLoading ? (
        <LoadingState label={t('reading.loading')} className="py-16" />
      ) : isError ? (
        <ErrorState title={t('reading.loadFailed')} onRetry={refetch} />
      ) : books.length === 0 ? (
        <div className="mt-8">
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
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-module items-start gap-6">
          <div className="grid min-w-0 grid-cols-1 content-start gap-5">
            <Shelf title={t('reading.readingNow')} books={grouped.reading} wide />
            <Shelf title={t('reading.finishedSection')} books={grouped.finished} wide />
            {grouped.reading.length === 0 && grouped.finished.length === 0 ? (
              <div className="rounded-card border border-dashed p-7 text-center">
                <p className="text-callout text-muted">{t('reading.nothingOpen')}</p>
              </div>
            ) : null}
          </div>

          <aside
            aria-label={t('reading.upNext')}
            className="sticky top-toolbar-clearance grid min-w-0 grid-cols-1 content-start gap-3.5"
          >
            {grouped.to_read.length > 0 ? (
              <Shelf title={t('reading.upNext')} books={grouped.to_read} />
            ) : (
              <div className="rounded-card border border-dashed p-7 text-center">
                <p className="text-callout text-muted">{t('reading.queueEmpty')}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
