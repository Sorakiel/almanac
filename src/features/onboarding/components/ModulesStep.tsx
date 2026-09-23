import { SelectTile } from '@/features/onboarding/components/SelectTile'
import { OPTIONAL_MODULES, type ModuleKey } from '@/stores/modules'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

interface ModulesStepProps {
  modules: Record<ModuleKey, boolean>
  onToggle: (key: ModuleKey) => void
}

/** Step 2: pick which optional modules show in the nav. Core ones are pinned. */
export function ModulesStep({ modules, onToggle }: ModulesStepProps) {
  const { t } = useT()
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
        {t('onboarding.buildYourApp')}
      </p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">{t('onboarding.pickModules')}</p>
      <p className="mx-auto mt-3 max-w-[420px] text-sm text-muted-strong">
        {t('onboarding.modulesHint')}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        {OPTIONAL_MODULES.map(({ key, icon: Icon }) => {
          const on = modules[key]
          return (
            <SelectTile key={key} on={on} onClick={() => onToggle(key)}>
              <span
                className={cn(
                  'flex h-10 w-10 flex-none items-center justify-center rounded-tile transition-colors',
                  on ? 'bg-accent/15 text-accent' : 'bg-border/10 text-muted-strong',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 font-semibold">{t(`modules.${key}.label`)}</span>
            </SelectTile>
          )
        })}
      </div>
    </>
  )
}
