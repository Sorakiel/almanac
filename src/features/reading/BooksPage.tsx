import { BookOpen, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { BookShelf } from '@/features/reading/components/BookShelf'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { BooksWorkspace } from '@/features/reading/components/desktop/BooksWorkspace'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useCreateIntent } from '@/hooks/useCreateIntent'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'

function BooksPage() {
  const { t } = useT()
  const { books, isLoading, isError, refetch } = useBooks()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [formOpen, setFormOpen] = useCreateIntent()

  const openNew = () => setFormOpen(true)
  const formKey = useOpenKey(formOpen)
  const formSheet = <BookFormSheet key={formKey} open={formOpen} onOpenChange={setFormOpen} />

  if (isDesktop) {
    return (
      <>
        <BooksWorkspace
          books={books}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          onNew={openNew}
        />
        {formSheet}
      </>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-callout text-muted">{t('reading.subtitle')}</p>
          <h1 className="mt-1 text-large-title font-bold tracking-title">{t('reading.title')}</h1>
        </div>
      </header>

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
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              {t('reading.addFirstBook')}
            </Button>
          }
        />
      ) : (
        <>
          <BookShelf books={books} />
          <Button size="lg" onClick={openNew} className="w-full shadow-glow">
            <Plus className="h-4 w-4" />
            {t('reading.addBook')}
          </Button>
        </>
      )}

      {formSheet}
    </section>
  )
}

export default BooksPage
