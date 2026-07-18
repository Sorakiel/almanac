import { supabase } from '@/lib/supabase'
import type { Feedback, FeedbackStatus, Profile, UserRole } from '@/features/admin/types'
import type { Database } from '@/types/database.generated'

type HabitRow = Database['public']['Tables']['habits']['Row']
type HabitLogLite = { habit_id: string; date: string; count: number }

/**
 * Admin reads go straight through PostgREST — the RLS policies already grant
 * admins cross-user SELECT via `public.is_admin()` (see migration 0001), so no
 * separate admin RPC is needed. A non-admin caller simply sees only their own
 * rows and the role gate keeps them off the page.
 */

/** All member profiles (admin-visible), newest first. */
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Exact row count for a table (head request, no rows transferred). */
export async function countRows(table: 'habits' | 'habit_logs'): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

/** Distinct user ids that logged a habit on the given local date. */
export async function fetchActiveUserIds(dateKey: string): Promise<string[]> {
  const { data, error } = await supabase.from('habit_logs').select('user_id').eq('date', dateKey)
  if (error) throw error
  return Array.from(new Set(data.map((r) => r.user_id)))
}

/** Recent feedback across all users (admin-visible), newest first. */
export async function fetchAllFeedback(): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

// --- Feedback triage (admin/owner: status + delete via RLS, migration 0015) --

/** Change a feedback item's status (open/planned/done/closed). */
export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const { error } = await supabase.from('feedback').update({ status }).eq('id', id)
  if (error) throw error
}

/** Permanently delete a feedback item. */
export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase.from('feedback').delete().eq('id', id)
  if (error) throw error
}

// --- User management (owner: roles; admin/owner: delete) ------------------

/** Appoint or demote an admin. Guarded server-side to the owner (RPC 0007). */
export async function setUserRole(target: string, role: UserRole): Promise<void> {
  const { error } = await supabase.rpc('set_user_role', { target, new_role: role })
  if (error) throw error
}

/** Permanently delete a user and all their data. Guarded server-side (RPC 0007). */
export async function deleteUser(target: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', { target })
  if (error) throw error
}

// --- Single-user detail (admin/owner cross-user SELECT via is_admin RLS) ---

/** One user's profile row. */
export async function fetchUserProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

/** A user's active (non-archived) habits, in sort order. */
export async function fetchUserHabits(userId: string): Promise<HabitRow[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

/** A user's habit logs on/after a date key (for recent-completion stats). */
export async function fetchUserLogsSince(userId: string, sinceKey: string): Promise<HabitLogLite[]> {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('habit_id, date, count')
    .eq('user_id', userId)
    .gte('date', sinceKey)
  if (error) throw error
  return data
}

/** A user's feedback, newest first. */
export async function fetchUserFeedback(userId: string): Promise<Feedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
