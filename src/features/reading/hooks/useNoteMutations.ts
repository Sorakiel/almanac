import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { createBookNote, deleteBookNote } from '@/features/reading/api/notes.api'

interface AddNoteInput {
  bookId: string
  body: string
  page: number | null
}

/** Add / delete notes for a book, invalidating its note list on settle. */
export function useNoteMutations(bookId: string) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['bookNotes', bookId] })

  const add = useMutation({
    mutationFn: (input: AddNoteInput) =>
      createBookNote({
        user_id: userId,
        book_id: input.bookId,
        body: input.body,
        page: input.page,
      }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteBookNote(id),
    onSuccess: invalidate,
  })

  return { add, remove }
}
