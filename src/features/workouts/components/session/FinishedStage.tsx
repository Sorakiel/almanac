import { useEffect, useRef } from 'react'
import { formatKg, formatTimer, type SetValues } from '@/features/workouts/lib/sessionRun'
import { useT } from '@/hooks/useT'
import { BURST_COLORS, burst } from '@/lib/burst'
import { intlLocale } from '@/lib/dateLocale'

// The prototype bursts once the medal has started spinning in.
const MEDAL_BURST_DELAY_MS = 280

interface FinishedStageProps {
  elapsedMs: number
  sets: number
  volume: number
  record: { name: string; values: SetValues; delta: number } | null
  onSave: () => void
}

/** The workout closed (`wStage`, finished): the medal, time · sets · volume, the record, save. */
export function FinishedStage({ elapsedMs, sets, volume, record, onSave }: FinishedStageProps) {
  const { t, locale } = useT()
  const loc = intlLocale(locale)
  const medal = useRef<HTMLDivElement>(null)
  // A one-shot celebration as the stage appears — an animation, not data.
  useEffect(() => {
    const timer = window.setTimeout(
      () => burst(medal.current, BURST_COLORS.medal),
      MEDAL_BURST_DELAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [])
  const stats = [
    { value: formatTimer(elapsedMs), label: t('workouts.session.time') },
    { value: String(sets), label: t('workouts.session.setsWord', { count: sets }) },
    { value: Math.round(volume).toLocaleString(loc), label: t('workouts.session.volumeWord') },
  ]
  return (
    <>
      <div
        ref={medal}
        className="ws-medal grid h-23 w-23 place-items-center rounded-full"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" className="h-11 w-11 stroke-white">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-title font-bold leading-tight tracking-title">
        {t('workouts.session.closed')}
      </h2>
      <div className="flex justify-center gap-5.5">
        {stats.map((s) => (
          <div key={s.label} className="text-footnote text-muted">
            <b className="num block text-callout font-medium text-foreground">{s.value}</b>
            {s.label}
          </div>
        ))}
      </div>
      {record ? (
        <p className="flex flex-wrap items-center justify-center gap-1.5 text-footnote text-muted">
          <span className="rounded-full bg-amber/20 px-1.75 py-0.5 text-caption font-semibold text-amber">
            {t('workouts.session.record')}
          </span>
          {t('workouts.session.recordLine', {
            name: record.name,
            weight: formatKg(record.values.weight, loc),
            reps: record.values.reps,
            delta: formatKg(record.delta, loc),
          })}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onSave}
        className="ws-done h-14.5 w-full rounded-full bg-teal text-body font-semibold text-white transition-transform active:scale-97 lg:max-w-105"
      >
        {t('workouts.session.save')}
      </button>
    </>
  )
}
