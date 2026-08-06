import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { useFocusStore } from '@/stores/focus'
import { useT } from '@/hooks/useT'

/**
 * The home screen's "now" slot: a live flow session, or nothing. As other timed
 * activities (workouts, reading) land they can surface here too.
 */
export function NowBlock() {
  const { t } = useT()
  const { endsAt, durationMin, label } = useFocusStore()
  const running = endsAt !== null && durationMin !== null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])

  // Nothing running is nothing to show. The completion summary used to live
  // here as the fallback, which made "now" mean two different things depending
  // on state; each layout now places its own summary (donut on desktop, strip
  // on mobile) where it belongs.
  if (!running) return null

  const msLeft = Math.max(endsAt - now, 0)
  const minLeft = Math.ceil(msLeft / 60_000)
  const elapsedMin = durationMin - msLeft / 60_000

  return (
    <Link
      to="/flow"
      className="relative block overflow-hidden rounded-card border border-accent/25 bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent"
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="label-mono text-accent">{t('dashboard.flowInSession')}</span>
          <span className="label-mono normal-case tabular-nums tracking-normal">
            {t('dashboard.minLeft', { count: minLeft })}
          </span>
        </div>
        <p className="truncate text-lg font-semibold tracking-title">
          {label ?? t('dashboard.focusSession')}
        </p>
        <ProgressBlocks
          value={Math.round(elapsedMin * 10)}
          total={durationMin * 10}
          blocks={22}
          aria-label={t('dashboard.minLeft', { count: minLeft })}
        />
      </div>
    </Link>
  )
}
