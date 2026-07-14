import { supabase } from '@/lib/supabase'

export interface RawAchievementData {
  completionDates: string[]
  habitsCount: number
  workoutsCompleted: number
  booksFinished: number
  pagesRead: number
  reflections: number
}

/** One-shot pull of the aggregates achievements are scored from (own-rows RLS). */
export async function fetchAchievementData(userId: string): Promise<RawAchievementData> {
  const [logs, habits, workouts, books, reflections] = await Promise.all([
    supabase.from('habit_logs').select('date, count').eq('user_id', userId),
    supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null),
    supabase.from('books').select('status, current_unit, progress_mode').eq('user_id', userId),
    supabase.from('reflections').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  if (logs.error) throw logs.error
  if (books.error) throw books.error

  const completionDates = (logs.data ?? [])
    .filter((row) => row.count >= 1)
    .map((row) => row.date)
  const bookRows = books.data ?? []

  return {
    completionDates,
    habitsCount: habits.count ?? 0,
    workoutsCompleted: workouts.count ?? 0,
    booksFinished: bookRows.filter((b) => b.status === 'finished').length,
    pagesRead: bookRows
      .filter((b) => b.progress_mode === 'pages')
      .reduce((sum, b) => sum + b.current_unit, 0),
    reflections: reflections.count ?? 0,
  }
}
