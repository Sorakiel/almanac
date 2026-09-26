import { useQueryClient } from '@tanstack/react-query'
import { useOfflineMutation, type OfflineMutation } from '@/hooks/useOfflineMutation'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { patchQueryData, rollbackQueryData, type OptimisticContext } from '@/lib/optimistic'
import { OFFLINE_MUTATION_KEYS, type SetHabitNoteVariables } from '@/lib/offlineMutations'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitLog } from '@/features/habits/types'

/**
 * The note on today's mark, written from the habit's page. Optimistic on the
 * history the page draws from and queued like the mark itself, so a note typed
 * offline survives a reload.
 */
export function useSetTodayNote(
  habit: Habit | undefined,
): OfflineMutation<void, SetHabitNoteVariables, string, OptimisticContext<HabitLog[]>> {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const habitId = habit?.id ?? ''
  const historyKey = habitKeys.history(habitId, dateKey)

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.setHabitNote,
    (note: string) => ({ userId, habitId, date: dateKey, note: note.trim() || null }),
    {
      onMutate: ({ note }) =>
        patchQueryData<HabitLog[]>(queryClient, historyKey, (logs) =>
          logs?.map((l) => (l.date === dateKey ? { ...l, note } : l)),
        ),
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, historyKey, context),
    },
  )
}
