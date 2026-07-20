import { BookOpen, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { BookShelf } from '@/features/reading/components/BookShelf'
import type { Book } from '@/features/reading/types'

interface BooksWorkspaceProps {
  books: Book[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
}

/** Desktop "Reading" workspace — the library grouped by status. */
export function BooksWorkspace({ books, isLoading, isError, refetch, onNew }: BooksWorkspaceProps) {
  return (
    <div className="mx-auto max-w-[900px]">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-mono">// your shelf</p>
          <h1 className="mt-1.5 text-[44px] leading-none tracking-title">Reading</h1>
          <p className="mt-2 text-[15px] text-muted">
            Track books, progress, and what you learned.
          </p>
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4" />
          Add book
        </Button>
      </header>

      <div className="mt-7">
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
              <Button size="sm" onClick={onNew}>
                <Plus className="h-4 w-4" />
                Add your first book
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
