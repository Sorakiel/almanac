import { useModulesStore } from '@/stores/modules'
import { SOON_MODULES } from '@/features/modules/soon'
import { useT } from '@/hooks/useT'
import { RailCard, RailRow } from '@/components/rail/RailCard'
import { RailIdentity } from '@/components/rail/RailIdentity'

/** Desktop Modules context rail: hub identity + overview counts. */
export function ModulesRail() {
  const { t } = useT()
  const enabled = useModulesStore((s) => s.enabled)
  const active = Object.values(enabled).filter(Boolean).length

  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity title={t('modulesPage.title')} subtitle={t('modulesPage.commandCenter')} />

      <RailCard label={t('modulesPage.overview')}>
        <RailRow label={t('modulesPage.inYourNav')} value={String(active)} />
        <RailRow label={t('modulesPage.comingSoonLower')} value={String(SOON_MODULES.length)} />
      </RailCard>

      <p className="px-1 text-[13px] italic leading-relaxed text-muted">
        {t('modulesPage.railBlurb')}
      </p>
    </div>
  )
}
