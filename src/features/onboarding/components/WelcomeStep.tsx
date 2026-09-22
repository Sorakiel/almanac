import { BrandMark } from '@/components/common/BrandMark'
import { useT } from '@/hooks/useT'

export function WelcomeStep() {
  const { t } = useT()
  return (
    <>
      <BrandMark size="xl" glow className="mx-auto" />
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-accent">
        {t('onboarding.welcomeTo')}
      </p>
      <p className="mt-2.5 font-mono text-5xl font-bold tracking-[0.04em] sm:text-[58px]">
        ALMANAC
      </p>
      <p className="mx-auto mt-4 max-w-[460px] text-lg leading-relaxed text-muted">
        {t('onboarding.welcomeBlurb')}
      </p>
    </>
  )
}
