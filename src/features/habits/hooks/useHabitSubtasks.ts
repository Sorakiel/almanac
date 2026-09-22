import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { patchQueryData, rollbackQueryData } from '@/lib/optimistic'
import { fetchSubtasks, setHabitCount } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import { dailyTarget } from '@/features/habits/lib/frequency'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import type { Habit, HabitSubtask } from '@/features/habits/types'

function withDates(
  subtasks: HabitSubtask[] | undefined,
  subtaskId: string,
  dates: string[],
): HabitSubtask[] | undefined {
  return subtasks?.map((s) => (s.id === subtaskId ? { ...s, completed_dates: dates } : s))
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
      void queryClient.invalidateQueries({ queryKey: habitKeys.history(habitId) })
      void queryClient.invalidateQueries({ queryKey: ['habitLogs'] })
    })
  }

  const add = useOfflineMutation(OFFLINE_MUTATION_KEYS.createSubtask, (title: string) => ({
    userId,
    habitId,
    title,
    sortOrder: query.data?.length ?? 0,
  }))
  const remove = useOfflineMutation(OFFLINE_MUTATION_KEYS.deleteSubtask, (id: string) => ({
    id,
    habitId,
  }))

  // Optimistic: the checkbox flips instantly, rolls back on error. The
  // habit-count mirror below stays live-only; see the note next to
  // OFFLINE_MUTATION_KEYS.toggleSubtask.
  const toggleToday = useOfflineMutation(
    OFFLINE_MUTATION_KEYS.toggleSubtask,
    ({ subtask, checked }: { subtask: HabitSubtask; checked: boolean }) => ({
      habitId,
      subtaskId: subtask.id,
      dates: checked
        ? [...subtask.completed_dates, dateKey]
        : subtask.completed_dates.filter((d) => d !== dateKey),
    }),
    {
      onMutate: ({ subtaskId, dates }) =>
        patchQueryData<HabitSubtask[]>(queryClient, key, (previous) =>
          withDates(previous, subtaskId, dates),
        ),
      onSuccess: (_data, { subtaskId, dates }, context) => {
        const next = withDates(context?.previous, subtaskId, dates)
        if (next) syncHabitCompletion(next)
      },
      onError: (_error, _vars, context) => rollbackQueryData(queryClient, key, context),
    },
  )

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
