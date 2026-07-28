import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import {
  createSubtask,
  deleteSubtask,
  fetchSubtasks,
  setHabitCount,
  setSubtaskCompletedDates,
} from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { dailyTarget } from '@/features/habits/lib/frequency'
import type { Habit, HabitSubtask } from '@/features/habits/types'

/**
 * A habit's checklist, plus today's checked state and CRUD/toggle mutations.
 * Once you interact with the checklist, it becomes authoritative for today's
 * completion: checking the last item marks the habit done, unchecking any
 * item un-marks it — same as any nested-task list.
 */
export function useHabitSubtasks(habit: Habit) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''
  const habitId = habit.id
  const key = habitKeys.subtasks(habitId)

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchSubtasks(habitId),
    enabled: habitId.length > 0,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: key })

  const syncHabitCompletion = (subtasks: HabitSubtask[]) => {
    if (subtasks.length === 0) return
    const allChecked = subtasks.every((s) => s.completed_dates.includes(dateKey))
    void setHabitCount({
      userId,
      habitId,
      date: dateKey,
      count: allChecked ? dailyTarget(habit) : 0,
    }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ['habitHistory', habitId] })
      void queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
    })
  }

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
      let next: HabitSubtask[] | undefined
      if (previous) {
        const dates = checked
          ? [...subtask.completed_dates, dateKey]
          : subtask.completed_dates.filter((d) => d !== dateKey)
        next = previous.map((s) => (s.id === subtask.id ? { ...s, completed_dates: dates } : s))
        queryClient.setQueryData<HabitSubtask[]>(key, next)
      }
      return { previous, next }
    },
    onSuccess: (_data, _vars, context) => {
      if (context?.next) syncHabitCompletion(context.next)
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
