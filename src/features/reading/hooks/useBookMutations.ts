import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import {
  createBook,
  deleteBook,
  updateBook,
  type BookPatch,
} from '@/features/reading/api/books.api'
import type { BookInsert } from '@/features/reading/types'

/** Create / edit / delete books, invalidating the library and detail on settle. */
export function useBookMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''

  const invalidate = (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['books', userId] })
    if (id) void queryClient.invalidateQueries({ queryKey: ['book', id] })
  }

  const create = useMutation({
    mutationFn: (input: Omit<BookInsert, 'user_id'>) => createBook({ ...input, user_id: userId }),
    onSuccess: () => invalidate(),
  })

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BookPatch }) => updateBook(id, patch),
    onSuccess: (_data, { id }) => invalidate(id),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => invalidate(),
  })

  return { create, update, remove }
}
