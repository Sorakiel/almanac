import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import type { BookPatch } from '@/features/reading/api/books.api'
import {
  OFFLINE_MUTATION_KEYS,
  type CreateBookVariables,
  type DeleteBookVariables,
  type UpdateBookVariables,
} from '@/lib/offlineMutations'
import type { Book, BookInsert } from '@/features/reading/types'

/**
 * Create / edit / delete books, invalidating the library and detail on
 * settle. mutationFn and the settle invalidation live once in
 * registerOfflineMutations (src/lib/offlineMutations.ts) — see
 * useToggleHabit for why.
 */
export function useBookMutations() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const createMutation = useMutation<Book, Error, CreateBookVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.createBook,
  })
  const create = {
    ...createMutation,
    mutate: (
      input: Omit<BookInsert, 'user_id'>,
      options?: MutateOptions<Book, Error, CreateBookVariables>,
    ) => createMutation.mutate({ input, userId }, options),
    mutateAsync: (input: Omit<BookInsert, 'user_id'>) =>
      createMutation.mutateAsync({ input, userId }),
  }

  const updateMutation = useMutation<Book, Error, UpdateBookVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.updateBook,
  })
  const update = {
    ...updateMutation,
    mutate: (
      args: { id: string; patch: BookPatch },
      options?: MutateOptions<Book, Error, UpdateBookVariables>,
    ) => updateMutation.mutate({ ...args, userId }, options),
    mutateAsync: (args: { id: string; patch: BookPatch }) =>
      updateMutation.mutateAsync({ ...args, userId }),
  }

  const removeMutation = useMutation<void, Error, DeleteBookVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.deleteBook,
  })
  const remove = {
    ...removeMutation,
    mutate: (id: string, options?: MutateOptions<void, Error, DeleteBookVariables>) =>
      removeMutation.mutate({ id, userId }, options),
    mutateAsync: (id: string) => removeMutation.mutateAsync({ id, userId }),
  }

  return { create, update, remove }
}
