import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Cascade } from '@/components/common/Cascade'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { Switch } from '@/components/ui/switch'
import { Rail } from '@/components/common/desktop/rail'
import { ModulesRail } from '@/features/modules/components/ModulesRail'
import { FeedbackSheet } from '@/features/modules/components/FeedbackSheet'
import { SOON_MODULES } from '@/features/modules/soon'
import { NAV_MODULES, useModulesStore, type ModuleKey } from '@/stores/modules'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

/** Per-module icon tint, keyed to the shared NAV_MODULES list. */
const MODULE_TONE: Record<ModuleKey, string> = {
  habits: 'bg-accent/15 text-accent',
  workouts: 'bg-teal/15 text-teal',
  insights: 'bg-amber/15 text-amber',
  flow: 'bg-accent/15 text-accent',
  reflect: 'bg-teal/15 text-teal',
  reading: 'bg-amber/15 text-amber',
  social: 'bg-accent/15 text-accent',
}

function ModulesPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const enabled = useModulesStore((s) => s.enabled)
  const toggle = useModulesStore((s) => s.toggle)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-5 lg:max-w-[760px]">
        <header>
          <p className="label-mono">// {t('modulesPage.commandCenter')}</p>
          <h1 className="mt-1 text-2xl lg:mt-1.5 lg:text-[32px] lg:tracking-title">
            {t('modulesPage.title')}
          </h1>
        </header>

        <Cascade>
          <section className="flex flex-col gap-3">
            <SectionLabel accessory={t('modulesPage.switchHint')}>
              {t('modulesPage.eyebrow')}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {NAV_MODULES.map((m) => {
                const on = enabled[m.key]
                return (
                  <div
                    key={m.key}
                    className={cn(
                      'relative flex flex-col rounded-[20px] border p-4 transition-colors',
                      on
                        ? 'border-accent/25 bg-gradient-to-br from-accent/[0.07] to-transparent'
                        : 'bg-surface hover:border-accent/25',
                    )}
                  >
                    {/* Stretched overlay: the whole card opens the module; the
                      nav switch sits above it (z-10) with its own click. */}
                    <button
                      type="button"
                      onClick={() => navigate(m.to)}
                      aria-label={t('nav.openModule', { name: t(`modules.${m.key}.label`) })}
                      className="absolute inset-0 z-0 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    />
                    <div className="flex items-start justify-between">
                      <IconTile icon={m.icon} tone={MODULE_TONE[m.key]} size="sm" />
                      <div className="relative z-10">
                        {m.core ? (
                          // Core modules are permanent — locked on, no toggle.
                          <Tag tone="muted">{t('modulesPage.pinned')}</Tag>
                        ) : (
                          <Switch
                            checked={on}
                            onCheckedChange={() => toggle(m.key)}
                            aria-label={t('nav.showInNav', { name: t(`modules.${m.key}.label`) })}
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold">{t(`modules.${m.key}.label`)}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {t(`modules.${m.key}.description`)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>{t('modulesPage.comingSoon')}</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {SOON_MODULES.map((m) => (
                <div
                  key={m.key}
                  className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed px-3 py-4 text-center opacity-80"
                >
                  <IconTile icon={m.icon} tone="bg-border/10 text-muted" size="sm" />
                  <p className="text-[13px] font-medium text-muted">
                    {t(`modulesPage.soonModules.${m.key}`)}
                  </p>
                  <Tag tone="muted">{t('modulesPage.soon')}</Tag>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-3 rounded-card border border-accent/25 bg-gradient-to-br from-accent/[0.06] to-transparent px-4 py-4 text-left text-sm text-muted transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
            {t('modulesPage.feedbackCta')}
          </button>
        </Cascade>

        <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      </div>
      <Rail>
        <ModulesRail />
      </Rail>
    </>
  )
}

export default ModulesPage
