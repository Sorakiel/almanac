import { supabase } from '@/lib/supabase'

export interface RawAchievementData {
  totalCompletions: number
  currentStreak: number
  bestStreak: number
  habitsCount: number
  workoutsCompleted: number
  booksFinished: number
  pagesRead: number
  chaptersRead: number
  notesWritten: number
  reflections: number
  tonnage: number
  focusMinutes: number
  earlyCount: number
  lateCount: number
  friendsCount: number
}

/**
 * One-shot pull of the aggregates achievements are scored from (own-rows RLS).
 *
 * Everything here is O(1) over the wire: the habit-log and training-history
 * side is folded in the database by `achievement_stats` (all-time check-offs,
 * best/current streak, tonnage, focus minutes, and time-of-day habit counts —
 * each drawn from a table that grows without bound), the rest are head
 * counts. `todayKey` is the user's local calendar date and `timezone` its IANA
 * zone — only the client knows either, so both travel as arguments.
 */
export async function fetchAchievementData(
  userId: string,
  todayKey: string,
  timezone: string,
): Promise<RawAchievementData> {
  const [streaks, habits, workouts, books, notes, reflections, friends] = await Promise.all([
    supabase.rpc('achievement_stats', { p_today: todayKey, p_timezone: timezone }).single(),
    supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null),
    supabase.from('books').select('status, current_unit, progress_mode').eq('user_id', userId),
    supabase.from('book_notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('reflections').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ])

  if (streaks.error) throw streaks.error
  if (books.error) throw books.error

  const bookRows = books.data ?? []

  return {
    totalCompletions: streaks.data.total_completions,
    currentStreak: streaks.data.current_streak,
    bestStreak: streaks.data.best_streak,
    habitsCount: habits.count ?? 0,
    workoutsCompleted: workouts.count ?? 0,
    booksFinished: bookRows.filter((b) => b.status === 'finished').length,
    pagesRead: bookRows
      .filter((b) => b.progress_mode === 'pages')
      .reduce((sum, b) => sum + b.current_unit, 0),
    chaptersRead: bookRows
      .filter((b) => b.progress_mode === 'chapters')
      .reduce((sum, b) => sum + b.current_unit, 0),
    notesWritten: notes.count ?? 0,
    reflections: reflections.count ?? 0,
    tonnage: streaks.data.total_tonnage,
    focusMinutes: streaks.data.focus_minutes,
    earlyCount: streaks.data.early_count,
    lateCount: streaks.data.late_count,
    friendsCount: friends.count ?? 0,
  }
}
