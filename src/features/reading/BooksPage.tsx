import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { ReadingWorkspace } from '@/features/reading/components/ReadingWorkspace'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useCreateIntent } from '@/hooks/useCreateIntent'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'

function BooksPage() {
  const { t } = useT()
  const { books, isLoading, isError, refetch } = useBooks()
  const [formOpen, setFormOpen] = useCreateIntent()
  const formKey = useOpenKey(formOpen)

  return (
    <>
      {isLoading ? (
        <LoadingState label={t('reading.loading')} className="py-16" />
      ) : isError ? (
        <ErrorState title={t('reading.loadFailed')} onRetry={refetch} />
      ) : (
        <ReadingWorkspace books={books} onAdd={() => setFormOpen(true)} />
      )}
      <BookFormSheet key={formKey} open={formOpen} onOpenChange={setFormOpen} />
    </>
  )
}

export default BooksPage
