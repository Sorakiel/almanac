import type { QueryClient } from '@tanstack/react-query'
import type { ChecklistDraftItem } from '@/features/habits/api/habits.api'
import { habitKeys } from '@/features/habits/hooks/queryKeys'
import type { Habit, HabitFreeze, HabitLog, HabitSubtask } from '@/features/habits/types'
import type { HabitFormInput } from '@/features/habits/hooks/useHabitMutations'

/** The order `fetchHabits` returns, so an optimistic row sits where the refetch will put it. */
function byDisplayOrder(a: Habit, b: Habit): number {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
}

/** `input` applied over a habit row, the way the server will store it. */
export function withInput(habit: Habit, input: HabitFormInput): Habit {
  return {
    ...habit,
    name: input.name,
    description: input.description ?? null,
    icon: input.icon ?? null,
    color: input.color ?? null,
    frequency: input.frequency ?? 'daily',
    target_count: input.target_count,
    time_of_day: input.time_of_day ?? 'anytime',
  }
}

/** The row a create will produce — `sort_order` 0 is the column default. */
export function draftHabit(id: string, userId: string, input: HabitFormInput): Habit {
  const blank: Habit = {
    id,
    user_id: userId,
    name: '',
    description: null,
    icon: null,
    color: null,
    frequency: input.frequency ?? 'daily',
    target_count: 1,
    time_of_day: 'anytime',
    sort_order: 0,
    archived_at: null,
    created_at: new Date().toISOString(),
  }
  return withInput(blank, input)
}

export function findHabit(client: QueryClient, userId: string, id: string): Habit | undefined {
  return (
    client.getQueryData<Habit[]>(habitKeys.all(userId))?.find((h) => h.id === id) ??
    client.getQueryData<Habit | null>(habitKeys.detail(id)) ??
    undefined
  )
}

/** Insert or replace one habit in the list and its detail entry. */
export function putHabit(client: QueryClient, userId: string, habit: Habit): void {
  client.setQueryData<Habit[]>(habitKeys.all(userId), (list) =>
    list ? [...list.filter((h) => h.id !== habit.id), habit].sort(byDisplayOrder) : list,
  )
  client.setQueryData<Habit>(habitKeys.detail(habit.id), habit)
}

export function dropHabit(client: QueryClient, userId: string, id: string): void {
  client.setQueryData<Habit[]>(habitKeys.all(userId), (list) => list?.filter((h) => h.id !== id))
}

/**
 * Everything the detail page reads for a habit the server has not seen yet.
 * Offline those queries would pause with nothing to show; a new habit's
 * history and freezes are known to be empty.
 */
export function seedNewHabit(
  client: QueryClient,
  habit: Habit,
  checklist: ChecklistDraftItem[],
  dateKey: string,
): void {
  putHabit(client, habit.user_id, habit)
  client.setQueryData<HabitLog[]>(habitKeys.history(habit.id, dateKey), [])
  client.setQueryData<HabitFreeze[]>(habitKeys.freezesOf(habit.id, dateKey), [])
  client.setQueryData<HabitSubtask[]>(
    habitKeys.subtasks(habit.id),
    checklist.map(({ id, title }, sort_order) => ({
      id,
      title,
      sort_order,
      habit_id: habit.id,
      user_id: habit.user_id,
      completed_dates: [],
      created_at: habit.created_at,
    })),
  )
}
