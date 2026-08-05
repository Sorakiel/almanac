import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import {
  OFFLINE_MUTATION_KEYS,
  type CreateBookNoteVariables,
  type DeleteBookNoteVariables,
} from '@/lib/offlineMutations'
import type { BookNote } from '@/features/reading/types'

interface AddNoteInput {
  bookId: string
  body: string
  page: number | null
}

/**
 * Add / delete notes for a book, invalidating its note list on settle.
 * mutationFn and the settle invalidation live once in
 * registerOfflineMutations (src/lib/offlineMutations.ts) — see
 * useToggleHabit for why.
 */
export function useNoteMutations(bookId: string) {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const addMutation = useMutation<BookNote, Error, CreateBookNoteVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.createBookNote,
  })
  const add = {
    ...addMutation,
    mutate: (
      input: AddNoteInput,
      options?: MutateOptions<BookNote, Error, CreateBookNoteVariables>,
    ) => addMutation.mutate({ ...input, userId }, options),
    mutateAsync: (input: AddNoteInput) => addMutation.mutateAsync({ ...input, userId }),
  }

  const removeMutation = useMutation<void, Error, DeleteBookNoteVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.deleteBookNote,
  })
  const remove = {
    ...removeMutation,
    mutate: (id: string, options?: MutateOptions<void, Error, DeleteBookNoteVariables>) =>
      removeMutation.mutate({ id, bookId }, options),
    mutateAsync: (id: string) => removeMutation.mutateAsync({ id, bookId }),
  }

  return { add, remove }
}
