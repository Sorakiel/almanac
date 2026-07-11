import { supabase } from '@/lib/supabase'

export interface LandingStats {
  members: number
  longestStreak: number
  avgCompletion: number
}

/**
 * Community counters for the pre-auth brand panel, via the `landing_stats`
 * SECURITY DEFINER RPC (aggregates only — anon-safe, no per-user rows).
 */
export async function fetchLandingStats(): Promise<LandingStats> {
  const { data, error } = await supabase.rpc('landing_stats')
  if (error) throw error
  const row = data?.[0]
  return {
    members: row?.members ?? 0,
    longestStreak: row?.longest_streak ?? 0,
    avgCompletion: row?.avg_completion ?? 0,
  }
}
