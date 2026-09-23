import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { useT } from '@/hooks/useT'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import type { BookPatch } from '@/features/reading/api/books.api'
import { readingKeys } from '@/features/reading/hooks/queryKeys'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import type { Book, BookInsert } from '@/features/reading/types'
import { toUserError } from '@/lib/userError'

type NewBookInput = Omit<BookInsert, 'user_id'>

/** The row a create will produce — the defaults are the columns' own. */
function draftBook(id: string, userId: string, input: NewBookInput): Book {
  return {
    author: null,
    current_unit: 0,
    daily_goal: null,
    finished_on: null,
    progress_mode: 'pages',
    rating: null,
    started_on: null,
    status: 'to_read',
    total_units: null,
    ...input,
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
  }
}

/**
 * Create / edit / delete books, invalidating the library and detail on settle.
 * Each patches the cache first, so the form can close without waiting —
 * offline the write queues behind it.
 */
export function useBookMutations() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const key = readingKeys.books(userId)

  const create = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createBook,
    ({ id = crypto.randomUUID(), ...input }: NewBookInput & { id?: string }) => ({
      input,
      userId,
      id,
    }),
    {
      onMutate: ({ input, id }) => {
        if (!id) return undefined
        const draft = draftBook(id, userId, input)
        // Its detail page too: offline that query would pause with nothing to show.
        queryClient.setQueryData<Book>(readingKeys.book(id), draft)
        return patchQueryData<Book[]>(queryClient, key, (previous) =>
          previous ? [draft, ...previous] : undefined,
        )
      },
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, key, context),
    },
  )
  const update = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateBook,
    (args: { id: string; patch: BookPatch }) => ({ ...args, userId }),
    {
      onMutate: async ({ id, patch }) => {
        queryClient.setQueryData<Book>(readingKeys.book(id), (b) => (b ? { ...b, ...patch } : b))
        return patchQueryData<Book[]>(queryClient, key, (previous) =>
          previous?.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        )
      },
      onError: (_error, { id }, context) => {
        rollbackQueryData(queryClient, key, context)
        void queryClient.invalidateQueries({ queryKey: readingKeys.book(id) })
      },
    },
  )
  const remove = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.deleteBook,
    (id: string) => ({ id, userId }),
    {
      onMutate: ({ id }) =>
        patchQueryData<Book[]>(queryClient, key, (previous) =>
          previous?.filter((b) => b.id !== id),
        ),
      // Toasted here: the sheet that fired it has already closed and navigated away.
      onError: (error, _vars, context) => {
        rollbackQueryData(queryClient, key, context)
        toast.error(toUserError(error, t, 'reading.form.removeFailed'))
      },
    },
  )

  return { create, update, remove }
}
