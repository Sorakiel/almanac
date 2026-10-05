import { useAchievements } from '@/features/achievements/hooks/useAchievements'
import { useFocusMonth } from '@/features/flow/hooks/useFocusMonth'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useReflections } from '@/features/reflect/hooks/useReflections'
import { journalStreak } from '@/features/reflect/lib/format'
import { useFriends } from '@/features/social/hooks/useFriends'
import { useTodaysWorkouts } from '@/features/workouts/hooks/useTodaysWorkouts'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import type { HubKey } from '@/features/modules/hub'

const MINUTES_PER_HOUR = 60

/**
 * The live line under each hub tile (prototype `MODLIST`: «8 активных ·
 * 3 выполнено», «Сегодня: Ноги», «212 из 320 стр»…), from the same queries
 * Today and each screen already hold. Null while a module's data is loading.
 */
export function useHubLines(): Record<HubKey, string | null> {
  const { t } = useT()
  const { dateKey } = useToday()
  const { habits, isLoading: habitsLoading } = useHabits()
  const { due } = useTodaysWorkouts()
  const { books, isLoading: booksLoading } = useBooks()
  const focusMinutes = useFocusMonth()
  const { reflections, isLoading: reflectLoading } = useReflections()
  const { data: friends, isLoading: friendsLoading } = useFriends()
  const { achievements, isLoading: achievementsLoading } = useAchievements()

  const habitsLine = habitsLoading
    ? null
    : `${t('modulesPage.line.habitsActive', { count: habits.length })} · ${t(
        'modulesPage.line.habitsDone',
        { count: habits.filter((h) => h.isComplete).length },
      )}`

  const workout = due.find((d) => !d.doneToday) ?? due[0]
  const workoutsLine = workout
    ? t('modulesPage.line.workoutToday', { name: workout.workout.name })
    : t('modulesPage.line.workoutRest')

  const book = books.find((b) => b.status === 'reading')
  const readingLine = booksLoading
    ? null
    : !book
      ? t('modulesPage.line.readingNone')
      : book.total_units
        ? t(`modulesPage.line.readingOf.${book.progress_mode}`, {
            current: book.current_unit,
            total: book.total_units,
          })
        : t(`reading.noteAt.${book.progress_mode}`, { n: book.current_unit })

  const flowLine =
    focusMinutes === null
      ? null
      : focusMinutes < MINUTES_PER_HOUR
        ? t('modulesPage.line.focusMinutes', { count: focusMinutes })
        : t('modulesPage.line.focusHours', {
            count: Math.floor(focusMinutes / MINUTES_PER_HOUR),
          })

  const streak = journalStreak(new Set(reflections.map((r) => r.date)), dateKey)
  const reflectLine = reflectLoading
    ? null
    : streak > 0
      ? t('modulesPage.line.reflectStreak', { count: streak })
      : t('modulesPage.line.reflectStart')

  const socialLine = friendsLoading
    ? null
    : friends.friends.length > 0
      ? t('modulesPage.line.friends', { count: friends.friends.length })
      : t('modulesPage.line.inviteFriend')

  const achievementsLine =
    achievementsLoading || achievements.length === 0
      ? null
      : t('modulesPage.line.achievements', {
          done: achievements.filter((a) => a.unlocked).length,
          total: achievements.length,
        })

  return {
    habits: habitsLine,
    workouts: workoutsLine,
    reading: readingLine,
    flow: flowLine,
    reflect: reflectLine,
    social: socialLine,
    achievements: achievementsLine,
  }
}
