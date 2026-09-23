import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { OFFLINE_MUTATION_KEYS, type CreateBookNoteVariables } from '@/lib/offlineMutations'

/** Add / delete notes for a book, invalidating its note list on settle. */
export function useNoteMutations(bookId: string) {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const add = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.createBookNote,
    (input: Omit<CreateBookNoteVariables, 'userId'>) => ({ ...input, userId }),
  )
  const remove = useOfflineMutation(OFFLINE_MUTATION_KEYS.deleteBookNote, (id: string) => ({
    id,
    bookId,
  }))

  return { add, remove }
}
