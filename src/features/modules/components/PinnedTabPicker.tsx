import { useT } from '@/hooks/useT'
import { PINNABLE_MODULES, useModulesStore, type PinnableModule } from '@/stores/modules'

/**
 * "Tab in the bar": none, or one module. One slot on purpose — the tab bar
 * stays at four; everything else is always one tap away in Modules. Only a
 * module that is switched on can take it.
 */
export function PinnedTabPicker() {
  const { t } = useT()
  const pinned = useModulesStore((s) => s.pinned)
  const setPinned = useModulesStore((s) => s.setPinned)
  const enabled = useModulesStore((s) => s.enabled)
  const choices: (PinnableModule | null)[] = [
    null,
    ...PINNABLE_MODULES.filter((m) => enabled[m.key]).map((m) => m.key as PinnableModule),
  ]

  return (
    <div role="radiogroup" aria-label={t('modulesPage.pinnedTab')} className="mods-group">
      {choices.map((key) => (
        <button
          key={key ?? 'none'}
          type="button"
          role="radio"
          aria-checked={pinned === key}
          className="mods-radio-row"
          onClick={() => setPinned(key)}
        >
          {key ? t(`modules.${key}.label`) : t('modulesPage.noTab')}
          <span className="mods-radio" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
