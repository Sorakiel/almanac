import { useState } from 'react'
import { BookOpen, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { BookShelf } from '@/features/reading/components/BookShelf'
import { BookTicker } from '@/features/reading/components/BookTicker'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { BooksWorkspace } from '@/features/reading/components/desktop/BooksWorkspace'
import { BooksRail } from '@/features/reading/components/desktop/BooksRail'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function BooksPage() {
  const { books, isLoading, isError, refetch } = useBooks()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [formOpen, setFormOpen] = useState(false)

  const openNew = () => setFormOpen(true)
  const formSheet = formOpen ? <BookFormSheet open onOpenChange={setFormOpen} /> : null

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
        <Rail>
          <BooksRail books={books} />
        </Rail>
        {formSheet}
      </>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">// your shelf</p>
          <h1 className="mt-1 text-2xl">Reading</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading your library…</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load your library"
          description="Something went wrong reaching the server."
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your shelf is empty"
          description="Add the book you're reading to start tracking progress and notes."
          action={
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Add your first book
            </Button>
          }
        />
      ) : (
        <>
          <BookTicker books={books} />
          <BookShelf books={books} />
          <Button size="lg" onClick={openNew} className="w-full shadow-glow">
            <Plus className="h-4 w-4" />
            Add book
          </Button>
        </>
      )}

      {formSheet}
    </section>
  )
}

export default BooksPage
