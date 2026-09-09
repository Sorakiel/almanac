import { BrandMark } from '@/components/common/BrandMark'
import { useLandingStats } from '@/features/auth/hooks/useLandingStats'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'
import { cn } from '@/lib/utils'

/** Desktop auth brand panel (spec board 03): warm-corner gradient, story, stats. */
export function AuthBrandPanel() {
  const { t, locale } = useT()
  const { stats } = useLandingStats()

  // Dashes until the counters land — the panel renders before the RPC answers.
  const figures: { key: TranslationKey; value: string; accent?: boolean }[] = [
    {
      key: 'auth.members',
      value: stats ? stats.members.toLocaleString(locale) : '—',
      accent: true,
    },
    {
      key: 'auth.longestStreak',
      value: stats ? t('units.daysShort', { count: stats.longestStreak }) : '—',
    },
    { key: 'auth.avgCompletion', value: stats ? `${stats.avgCompletion}%` : '—' },
  ]

  return (
    <aside className="relative hidden w-[620px] flex-none flex-col overflow-hidden bg-bg-deep px-14 py-14 lg:flex">
      {/* Warm accent wash from the top-left, mirroring the mock's gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-deep/25 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 78% 22%, rgb(var(--color-accent) / 0.16), transparent 46%)',
        }}
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <BrandMark onDeep />
          <span className="font-mono text-[19px] font-bold tracking-[0.05em]">ALMANAC</span>
        </div>

        <div className="flex-1" />

        <h2 className="max-w-[440px] text-[40px] leading-tight tracking-title">
          {t('auth.brandTagline')}
        </h2>
        <p className="mt-4 max-w-[420px] text-base leading-relaxed text-muted">
          {t('auth.brandBlurb')}
        </p>

        <dl className="mt-10 flex gap-9 font-mono">
          {figures.map((figure) => (
            <div key={figure.key}>
              <dd className={cn('text-[26px] font-semibold', figure.accent && 'text-accent')}>
                {figure.value}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-label text-muted-strong">
                {t(figure.key)}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}
