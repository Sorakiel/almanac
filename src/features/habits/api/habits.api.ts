import { supabase } from '@/lib/supabase'
import type { Habit, HabitFreeze, HabitInsert, HabitLog } from '@/features/habits/types'

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

/** Habit logs from `fromDate` (inclusive) onward — used for recent-history stats. */
export async function fetchLogsSince(userId: string, fromDate: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', fromDate)
  if (error) throw error
  return data
}

/** Freeze days across the user's habits from `fromDate` onward (list streaks). */
export async function fetchFreezesSince(userId: string, fromDate: string): Promise<HabitFreeze[]> {
  const { data, error } = await supabase
    .from('habit_freezes')
    .select('*')
    .eq('user_id', userId)
    .gte('date', fromDate)
  if (error) throw error
  return data
}

/** All freeze days for one habit from `fromDate` onward (detail streak/heatmap). */
export async function fetchHabitFreezes(habitId: string, fromDate: string): Promise<HabitFreeze[]> {
  const { data, error } = await supabase
    .from('habit_freezes')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', fromDate)
  if (error) throw error
  return data
}

/** Protect a day for a habit. Idempotent via the (habit_id, date) unique key. */
export async function addFreeze(userId: string, habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_freezes')
    .upsert({ user_id: userId, habit_id: habitId, date }, { onConflict: 'habit_id,date' })
  if (error) throw error
}

/** Remove a day's freeze protection. */
export async function removeFreeze(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_freezes')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)
  if (error) throw error
}

/** A single habit by id (own-rows RLS applies). */
export async function fetchHabitById(id: string): Promise<Habit> {
  const { data, error } = await supabase.from('habits').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/** All logs for one habit from `fromDate` onward, ascending by date. */
export async function fetchHabitHistory(habitId: string, fromDate: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', fromDate)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function createHabit(input: HabitInsert): Promise<Habit> {
  const { data, error } = await supabase.from('habits').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateHabit(id: string, patch: Partial<HabitInsert>): Promise<Habit> {
  const { data, error } = await supabase.from('habits').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Persist a new display order after drag-and-drop. */
export async function updateHabitOrder(
  ordered: { id: string; sort_order: number }[],
): Promise<void> {
  const results = await Promise.all(
    ordered.map(({ id, sort_order }) =>
      supabase.from('habits').update({ sort_order }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
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
    .upsert({ user_id: userId, habit_id: habitId, date, count }, { onConflict: 'habit_id,date' })
  if (error) throw error
}
