import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import {
  createSubtask,
  deleteSubtask,
  fetchSubtasks,
  setSubtaskCompletedDates,
} from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { HabitSubtask } from '@/features/habits/types'

/** A habit's checklist, plus today's checked state and CRUD/toggle mutations. */
export function useHabitSubtasks(habitId: string) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const key = habitKeys.subtasks(habitId)

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSubtasks(habitId),
    enabled: habitId.length > 0,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: key })

  const add = useMutation({
    mutationFn: (title: string) => {
      const nextOrder = query.data?.length ?? 0
      return createSubtask(userId, habitId, title, nextOrder)
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteSubtask(id),
    onSuccess: invalidate,
  })

  // Optimistic: the checkbox flips instantly, rolls back on error.
  const toggleToday = useMutation({
    mutationFn: ({ subtask, checked }: { subtask: HabitSubtask; checked: boolean }) => {
      const dates = checked
        ? [...subtask.completed_dates, dateKey]
        : subtask.completed_dates.filter((d) => d !== dateKey)
      return setSubtaskCompletedDates(subtask.id, dates)
    },
    onMutate: async ({ subtask, checked }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<HabitSubtask[]>(key)
      if (previous) {
        const dates = checked
          ? [...subtask.completed_dates, dateKey]
          : subtask.completed_dates.filter((d) => d !== dateKey)
        queryClient.setQueryData<HabitSubtask[]>(
          key,
          previous.map((s) => (s.id === subtask.id ? { ...s, completed_dates: dates } : s)),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: invalidate,
  })

  return {
    subtasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    add,
    remove,
    toggleToday,
    todayKey: dateKey,
  }
}
