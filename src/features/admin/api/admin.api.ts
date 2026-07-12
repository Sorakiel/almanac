import { supabase } from '@/lib/supabase'
import type { Feedback, Profile } from '@/features/admin/types'

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
