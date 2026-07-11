import { useLandingStats } from '@/features/auth/hooks/useLandingStats'

/** Desktop auth brand panel (spec board 03): warm-corner gradient, story, stats. */
export function AuthBrandPanel() {
  const { stats } = useLandingStats()
  const members = stats ? stats.members.toLocaleString('en-US') : '—'
  const longestStreak = stats ? `${stats.longestStreak}d` : '—'
  const avgCompletion = stats ? `${stats.avgCompletion}%` : '—'

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
          <span className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-accent-deep">
            <span
              aria-hidden="true"
              className="h-[11px] w-[11px] rotate-45 border-[1.8px] border-bg-deep"
            />
          </span>
          <span className="font-mono text-[19px] font-bold tracking-[0.05em]">ALMANAC</span>
        </div>

        <div className="flex-1" />

        <h2 className="max-w-[440px] text-[40px] leading-tight tracking-title">
          Your life, on the record.
        </h2>
        <p className="mt-4 max-w-[420px] text-base leading-relaxed text-muted">
          Habits, workouts, and daily discipline in one calm, quietly relentless command center.
        </p>

        <dl className="mt-10 flex gap-9 font-mono">
          <div>
            <dd className="text-[26px] font-semibold text-accent">{members}</dd>
            <dt className="mt-1 text-[10px] uppercase tracking-label text-muted-strong">members</dt>
          </div>
          <div>
            <dd className="text-[26px] font-semibold">{longestStreak}</dd>
            <dt className="mt-1 text-[10px] uppercase tracking-label text-muted-strong">
              longest streak
            </dt>
          </div>
          <div>
            <dd className="text-[26px] font-semibold">{avgCompletion}</dd>
            <dt className="mt-1 text-[10px] uppercase tracking-label text-muted-strong">
              avg completion
            </dt>
          </div>
        </dl>
      </div>
    </aside>
  )
}
