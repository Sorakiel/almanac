import { Check, Plus } from 'lucide-react'
import { useT } from '@/hooks/useT'

export function ReadyStep({ count }: { count: number }) {
  const { t } = useT()
  return (
    <>
      <span className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-accent-bright to-accent-deep shadow-glow">
        {count > 0 ? (
          <Check className="h-8 w-8 text-bg" aria-hidden="true" />
        ) : (
          <Plus className="h-7 w-7 text-bg" aria-hidden="true" />
        )}
      </span>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-accent">
        {t('onboarding.youAreSet')}
      </p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">
        {count > 0 ? t('onboarding.ready') : t('onboarding.startSingle')}
      </p>
      <div className="mt-6 rounded-card border border-dashed border-accent/40 bg-accent/[0.05] px-6 py-6">
        <p className="text-2xl text-accent" aria-hidden="true">
          ◇
        </p>
        <p className="mt-2 font-semibold">
          {count > 0 ? t('onboarding.habitsReady', { count }) : t('onboarding.nothingYet')}
        </p>
        <p className="mt-1 text-sm text-muted-strong">
          {count > 0 ? t('onboarding.startSingleHint') : t('onboarding.firstHabitHint')}
        </p>
      </div>
    </>
  )
}
