import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { SortableHabitList } from '@/features/habits/components/SortableHabitList'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { HomeModulesList } from '@/features/modules/components/HomeModulesList'
import { PinnedTabPicker } from '@/features/modules/components/PinnedTabPicker'
import { useT } from '@/hooks/useT'
import '@/features/modules/modules.css'

/**
 * Modules → Customize: which modules are on Today (and in the sidebar), in
 * what order, the habits' own order on Today, and which module takes the tab
 * bar's spare slot. Every change lands
 * at once — Today and the bars read the same store — and follows the account
 * to its other devices through `user_settings`.
 */
function CustomizePage() {
  const { t } = useT()
  const { habits } = useHabits()
  return (
    <div className="mods flex flex-col gap-6 lg:max-w-2xl">
      <div>
        <Link
          to="/more"
          viewTransition
          className="-ml-1.5 inline-flex items-center gap-0.5 py-2 text-body text-accent"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
          {t('modulesPage.title')}
        </Link>
        <h1 className="mx-0.5 mt-1 text-large-title font-bold">{t('modulesPage.customize')}</h1>
      </div>

      <section aria-labelledby="customize-home">
        <h2 id="customize-home" className="mods-sec-h">
          {t('modulesPage.onHomeHeading')}
        </h2>
        <HomeModulesList />
        <p className="mods-note">{t('modulesPage.onHomeNote')}</p>
      </section>

      {/* Habits are Today itself; their order is set here since /habits is gone (S2). */}
      {habits.length > 1 ? (
        <section aria-labelledby="customize-habits">
          <h2 id="customize-habits" className="mods-sec-h">
            {t('modulesPage.habitOrder')}
          </h2>
          <SortableHabitList habits={habits} />
          <p className="mods-note">{t('modulesPage.habitOrderNote')}</p>
        </section>
      ) : null}

      {/* The tab bar is the phone's; the desktop sidebar lists every module already. */}
      <section aria-labelledby="customize-tab" className="lg:hidden">
        <h2 id="customize-tab" className="mods-sec-h">
          {t('modulesPage.pinnedTab')}
        </h2>
        <PinnedTabPicker />
        <p className="mods-note">{t('modulesPage.pinnedTabNote')}</p>
      </section>
    </div>
  )
}

export default CustomizePage
