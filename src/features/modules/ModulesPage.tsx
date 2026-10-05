import { Link } from 'react-router-dom'
import { HomeModulesList } from '@/features/modules/components/HomeModulesList'
import { ModuleTile } from '@/features/modules/components/ModuleTile'
import { useHubLines } from '@/features/modules/hooks/useHubLines'
import { HUB_TILES } from '@/features/modules/hub'
import { SOON_MODULES } from '@/features/modules/soon'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { useModulesStore } from '@/stores/modules'
import '@/features/modules/modules.css'

/**
 * The hub: a tile for every module with its live line (tap opens it),
 * "Customize" for what shows on Today. On desktop Customize sits beside the
 * tiles as a card instead of a pushed screen, and "Soon" is the phone's only
 * (prototype.html `vModules`, desktop-prototype.html `pModules`).
 */
function ModulesPage() {
  const { t, locale } = useT()
  const enabled = useModulesStore((s) => s.enabled)
  const lines = useHubLines()

  const soon = new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(
    SOON_MODULES.map((m, i) => {
      const name = t(`modulesPage.soonModules.${m.key}`)
      return i === 0 ? name : name.toLocaleLowerCase(locale)
    }),
  )

  return (
    <div className="mods">
      <header className="mods-head">
        <div>
          <p className="text-callout font-medium text-muted">{t('modulesPage.subtitle')}</p>
          <h1 className="text-large-title font-bold">{t('modulesPage.title')}</h1>
        </div>
        <Link to="/more/customize" viewTransition className="mods-link">
          {t('modulesPage.customize')}
        </Link>
      </header>

      <div className="mods-layout">
        <div className="mods-grid">
          {HUB_TILES.map((tile) => (
            <ModuleTile
              key={tile.key}
              tile={tile}
              line={lines[tile.key]}
              off={tile.toggleable && !enabled[tile.key as keyof typeof enabled]}
            />
          ))}
        </div>

        <section aria-labelledby="mods-customize" className="mods-customize-card">
          <div>
            <b id="mods-customize">{t('modulesPage.customize')}</b>
            <small>{t('modulesPage.syncedEverywhere')}</small>
          </div>
          <HomeModulesList />
          <p className="mods-note">{t('modulesPage.onHomeNote')}</p>
        </section>

        <section aria-labelledby="mods-soon" className="mods-soon">
          <h2 id="mods-soon" className="mods-sec-h">
            {t('modulesPage.soonHeading')}
          </h2>
          <p className="mods-note">{t('modulesPage.soonNote', { list: soon })}</p>
        </section>
      </div>
    </div>
  )
}

export default ModulesPage
