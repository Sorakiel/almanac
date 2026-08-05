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
}

/**
 * One-shot pull of the aggregates achievements are scored from (own-rows RLS).
 *
 * Everything here is O(1) over the wire: the habit-log side is folded in the
 * database by `achievement_stats` (all-time check-offs plus best/current
 * streak), the rest are head counts. `todayKey` is the user's local calendar
 * date — only the client knows it, so the streak anchor travels as an argument.
 */
export async function fetchAchievementData(
  userId: string,
  todayKey: string,
): Promise<RawAchievementData> {
  const [streaks, habits, workouts, books, notes, reflections] = await Promise.all([
    supabase.rpc('achievement_stats', { p_today: todayKey }).single(),
    supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null),
    supabase.from('books').select('status, current_unit, progress_mode').eq('user_id', userId),
    supabase.from('book_notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('reflections').select('*', { count: 'exact', head: true }).eq('user_id', userId),
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
  }
}
