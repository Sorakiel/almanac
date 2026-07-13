import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import {
  createReflection,
  deleteReflection,
  updateReflection,
} from '@/features/reflect/api/reflections.api'

interface SaveInput {
  /** Existing reflection id when editing today's entry, else null to create. */
  id: string | null
  date: string
  body: string
  quoteId: string | null
  mood: number | null
  energy: number | null
  dayRating: number | null
}

/** Save (create or update today's) and delete reflections; invalidate on settle. */
export function useReflectionMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''
  const key = ['reflections', userId]
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: key })

  const save = useMutation({
    mutationFn: ({ id, date, body, quoteId, mood, energy, dayRating }: SaveInput) =>
      id
        ? updateReflection(id, { body, mood, energy, day_rating: dayRating })
        : createReflection({
            user_id: userId,
            date,
            body,
            quote_id: quoteId,
            mood,
            energy,
            day_rating: dayRating,
          }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteReflection(id),
    onSuccess: invalidate,
  })

  return { save, remove }
}
