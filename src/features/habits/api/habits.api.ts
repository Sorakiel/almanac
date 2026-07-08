import { supabase } from '@/lib/supabase'
import type { Habit, HabitInsert, HabitLog } from '@/features/habits/types'

/** Active (non-archived) habits for a user, ordered for display. */
export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

/** Today's habit logs (one row per habit per local date). */
export async function fetchLogsForDate(userId: string, date: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
  if (error) throw error
  return data
}

export async function createHabit(input: HabitInsert): Promise<Habit> {
  const { data, error } = await supabase.from('habits').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateHabit(id: string, patch: Partial<HabitInsert>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Soft-delete a habit by archiving it. */
export async function archiveHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

interface SetLogArgs {
  userId: string
  habitId: string
  date: string
  count: number
}

/**
 * Set today's count for a habit. Upserts on the (habit_id, date) unique key so
 * completion is idempotent; count 0 clears the log row.
 */
export async function setHabitCount({ userId, habitId, date, count }: SetLogArgs): Promise<void> {
  if (count <= 0) {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date)
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('habit_logs')
    .upsert(
      { user_id: userId, habit_id: habitId, date, count },
      { onConflict: 'habit_id,date' },
    )
  if (error) throw error
}
