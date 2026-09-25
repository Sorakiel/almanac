import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { HomeModulesList } from '@/features/modules/components/HomeModulesList'
import { PinnedTabPicker } from '@/features/modules/components/PinnedTabPicker'
import { useT } from '@/hooks/useT'
import '@/features/modules/modules.css'

/**
 * Modules → Customize: which modules are on Today (and in the sidebar), in
 * what order, and which one takes the tab bar's spare slot. Every change lands
 * at once — Today and the bars read the same store — and follows the account
 * to its other devices through `user_settings`.
 */
function CustomizePage() {
  const { t } = useT()
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
