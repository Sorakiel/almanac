import { useMutation, useQuery, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { fetchSubtasks, setHabitCount } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { dailyTarget } from '@/features/habits/lib/frequency'
import {
  OFFLINE_MUTATION_KEYS,
  type CreateSubtaskVariables,
  type DeleteSubtaskVariables,
  type ToggleSubtaskVariables,
} from '@/lib/offlineMutations'
import type { Habit, HabitSubtask } from '@/features/habits/types'

type ToggleSubtaskContext = {
  previous: HabitSubtask[] | undefined
  next: HabitSubtask[] | undefined
}

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

  const addMutation = useMutation<HabitSubtask, Error, CreateSubtaskVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.createSubtask,
  })
  const add = {
    ...addMutation,
    mutate: (title: string, options?: MutateOptions<HabitSubtask, Error, CreateSubtaskVariables>) =>
      addMutation.mutate({ userId, habitId, title, sortOrder: query.data?.length ?? 0 }, options),
    mutateAsync: (title: string) =>
      addMutation.mutateAsync({ userId, habitId, title, sortOrder: query.data?.length ?? 0 }),
  }

  const removeMutation = useMutation<void, Error, DeleteSubtaskVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.deleteSubtask,
  })
  const remove = {
    ...removeMutation,
    mutate: (id: string, options?: MutateOptions<void, Error, DeleteSubtaskVariables>) =>
      removeMutation.mutate({ id, habitId }, options),
    mutateAsync: (id: string) => removeMutation.mutateAsync({ id, habitId }),
  }

  // Optimistic: the checkbox flips instantly, rolls back on error. mutationFn
  // and the settle invalidation live in registerOfflineMutations — see
  // useToggleHabit for why. The habit-count mirror below stays live-only; see
  // the note next to OFFLINE_MUTATION_KEYS.toggleSubtask.
  const toggleTodayMutation = useMutation<
    void,
    Error,
    ToggleSubtaskVariables,
    ToggleSubtaskContext
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.toggleSubtask,
    onMutate: async ({ subtaskId, dates }: ToggleSubtaskVariables) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<HabitSubtask[]>(key)
      let next: HabitSubtask[] | undefined
      if (previous) {
        next = previous.map((s) => (s.id === subtaskId ? { ...s, completed_dates: dates } : s))
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
  })
  const toggleToday = {
    ...toggleTodayMutation,
    mutate: (
      args: { subtask: HabitSubtask; checked: boolean },
      options?: MutateOptions<void, Error, ToggleSubtaskVariables, ToggleSubtaskContext>,
    ) => {
      const dates = args.checked
        ? [...args.subtask.completed_dates, dateKey]
        : args.subtask.completed_dates.filter((d) => d !== dateKey)
      toggleTodayMutation.mutate({ habitId, subtaskId: args.subtask.id, dates }, options)
    },
  }

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
