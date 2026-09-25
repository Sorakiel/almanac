import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { FeedbackSheet } from '@/features/modules/components/FeedbackSheet'
import { HomeModulesList } from '@/features/modules/components/HomeModulesList'
import { ModuleTile } from '@/features/modules/components/ModuleTile'
import { SOON_MODULES } from '@/features/modules/soon'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { NAV_MODULES, useModulesStore } from '@/stores/modules'
import '@/features/modules/modules.css'

/**
 * The hub: a tile for every module (tap opens it), "Customize" for what shows
 * on Today. On desktop Customize sits beside the tiles as a card instead of a
 * pushed screen (desktop-prototype.html `.dk-mods`).
 */
function ModulesPage() {
  const { t, locale } = useT()
  const enabled = useModulesStore((s) => s.enabled)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const soon = new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(
    SOON_MODULES.map((m) => t(`modulesPage.soonModules.${m.key}`).toLocaleLowerCase(locale)),
  )

  return (
    <div className="mods">
      <header className="mods-head">
        <div>
          <p className="text-callout font-medium text-muted">{t('modulesPage.subtitle')}</p>
          <h1 className="text-large-title font-bold">{t('modulesPage.title')}</h1>
        </div>
        <Link to="/more/customize" className="mods-link">
          {t('modulesPage.customize')}
        </Link>
      </header>

      <div className="mods-layout">
        <div className="flex flex-col gap-5">
          <div className="mods-grid">
            {NAV_MODULES.map((m) => (
              <ModuleTile key={m.key} module={m} off={!m.core && !enabled[m.key]} />
            ))}
          </div>

          <p className="px-1 text-callout text-muted">
            {t('modulesPage.soonLine', { list: soon })}
          </p>

          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-3 rounded-card bg-surface px-4 py-4 text-left text-callout text-muted transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
            {t('modulesPage.feedbackCta')}
          </button>
        </div>

        <section aria-labelledby="mods-customize" className="mods-customize-card">
          <div>
            <b id="mods-customize">{t('modulesPage.customize')}</b>
            <small>{t('modulesPage.syncedEverywhere')}</small>
          </div>
          <HomeModulesList />
          <p className="mods-note">{t('modulesPage.onHomeNote')}</p>
        </section>
      </div>

      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  )
}

export default ModulesPage
