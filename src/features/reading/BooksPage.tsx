import { useCallback, useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Inspector } from '@/components/inspector/Inspector'
import { BookShelf } from '@/features/reading/components/BookShelf'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { BooksWorkspace } from '@/features/reading/components/desktop/BooksWorkspace'
import { BookDetailPanel } from '@/features/reading/components/BookDetailPanel'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useCreateIntent } from '@/hooks/useCreateIntent'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLastValue, useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'

function BooksPage() {
  const { t } = useT()
  const { books, isLoading, isError, refetch } = useBooks()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [formOpen, setFormOpen] = useCreateIntent()
  // Desktop opens a book in the inspector; the last one stays rendered while
  // the panel slides out.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const shownId = useLastValue(selectedId)
  const closeInspector = useCallback(() => setSelectedId(null), [])

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
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
        />
        <Inspector
          open={selectedId !== null}
          onClose={closeInspector}
          label={t('reading.inspector')}
        >
          {shownId ? <BookDetailPanel key={shownId} id={shownId} onGone={closeInspector} /> : null}
        </Inspector>
        {formSheet}
      </>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">{t('reading.shelfLabel')}</p>
          <h1 className="mt-1 text-2xl">{t('reading.title')}</h1>
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
