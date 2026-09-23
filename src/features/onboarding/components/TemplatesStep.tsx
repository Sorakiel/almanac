import { SelectTile } from '@/features/onboarding/components/SelectTile'
import { HABIT_TEMPLATES } from '@/features/onboarding/lib/templates'
import { HABIT_ICONS } from '@/features/habits/lib/habitVisuals'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

interface TemplatesStepProps {
  picks: Set<string>
  onToggle: (key: string) => void
}

/** Step 3: multi-select starter habits, created on finish. */
export function TemplatesStep({ picks, onToggle }: TemplatesStepProps) {
  const { t } = useT()
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
        {t('onboarding.startTracking')}
      </p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">{t('onboarding.addHabits')}</p>
      <p className="mx-auto mt-3 max-w-[420px] text-sm text-muted-strong">
        {t('onboarding.addHabitsHint')}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        {HABIT_TEMPLATES.map((tpl) => {
          const Icon = HABIT_ICONS[tpl.icon]
          const on = picks.has(tpl.key)
          return (
            <SelectTile key={tpl.key} on={on} onClick={() => onToggle(tpl.key)} compact>
              <span
                className={cn(
                  'flex h-9 w-9 flex-none items-center justify-center rounded-tile transition-colors',
                  on ? 'bg-accent/15 text-accent' : 'bg-border/10 text-muted-strong',
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">
                {t(`onboarding.suggestions.${tpl.key}`)}
              </span>
            </SelectTile>
          )
        })}
      </div>
    </>
  )
}
