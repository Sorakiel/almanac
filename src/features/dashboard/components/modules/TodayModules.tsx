import type { ReactElement } from 'react'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useTodaysWorkouts } from '@/features/workouts/hooks/useTodaysWorkouts'
import { EVENING_HOUR, localHour } from '@/features/dashboard/lib/localHour'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { useModulesStore, type OrderedModule } from '@/stores/modules'
import { FocusModuleCard } from './FocusModuleCard'
import { ReadingModuleCard } from './ReadingModuleCard'
import { ReflectModuleCard } from './ReflectModuleCard'
import { WorkoutModuleCard } from './WorkoutModuleCard'

/**
 * One card per enabled module that has something to do today. A module with
 * nothing today (no workout scheduled, no book open) stays off the screen
 * rather than showing an empty card; reflection only joins in the evening.
 */
export function TodayModules() {
  const { t } = useT()
  const enabled = useModulesStore((s) => s.enabled)
  const order = useModulesStore((s) => s.order)
  const { timezone } = useToday()
  const { due } = useTodaysWorkouts()
  const { books } = useBooks()

  const workout = due.find((d) => !d.doneToday) ?? due[0]
  const book = books.find((b) => b.status === 'reading')
  const evening = localHour(timezone) >= EVENING_HOUR

  // In the order set in Customize; a module without a card (friends) is skipped.
  const card = (key: OrderedModule): ReactElement | null => {
    if (!enabled[key]) return null
    if (key === 'workouts' && workout) return <WorkoutModuleCard key={key} item={workout} />
    if (key === 'reading' && book) return <ReadingModuleCard key={key} book={book} />
    if (key === 'flow') return <FocusModuleCard key={key} />
    if (key === 'reflect' && evening) return <ReflectModuleCard key={key} />
    return null
  }
  const cards = order.map(card).filter((c): c is ReactElement => c !== null)

  if (cards.length === 0) return null
  return (
    <section aria-labelledby="today-modules">
      {/* Desktop's aside sets the cards under the rings with no heading of its own. */}
      <h2 id="today-modules" className="today-sec-h lg:sr-only">
        {t('dashboard.modulesHeading')}
      </h2>
      <div className="flex flex-col gap-2.5 pt-0.5 lg:pt-0">{cards}</div>
    </section>
  )
}
