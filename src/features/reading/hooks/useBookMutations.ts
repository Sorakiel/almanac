import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import type { BookPatch } from '@/features/reading/api/books.api'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import type { BookInsert } from '@/features/reading/types'

/** Create / edit / delete books, invalidating the library and detail on settle. */
export function useBookMutations() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const create = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createBook,
    (input: Omit<BookInsert, 'user_id'>) => ({ input, userId }),
  )
  const update = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.updateBook,
    (args: { id: string; patch: BookPatch }) => ({ ...args, userId }),
  )
  const remove = useOfflineMutation(OFFLINE_MUTATION_KEYS.deleteBook, (id: string) => ({
    id,
    userId,
  }))

  return { create, update, remove }
}
