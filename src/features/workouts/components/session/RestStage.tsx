import { Trans } from '@/components/common/Trans'
import { WaveRing } from '@/features/workouts/components/session/WaveRing'
import { formatTimer } from '@/features/workouts/lib/sessionRun'
import { useT } from '@/hooks/useT'

interface RestStageProps {
  restMs: number
  restTotalMs: number
  /** "Присед · подход 2", or null at the end. */
  next: string | null
  onAdjust: (seconds: number) => void
  onReady: () => void
}

/** Rest (`wStage`, Rest): the water ring, −15 / Ready / +15, and what comes next. */
export function RestStage({ restMs, restTotalMs, next, onAdjust, onReady }: RestStageProps) {
  const { t } = useT()
  const side =
    'num rounded-full bg-sheet-fill px-4 py-3 text-callout font-medium transition-transform active:scale-95'
  return (
    <>
      <WaveRing
        level={restMs / Math.max(restTotalMs, 1)}
        time={formatTimer(restMs)}
        label={t('workouts.session.restLabel')}
      />
      <div className="flex justify-center gap-2">
        <button
          type="button"
          aria-label={t('workouts.session.restLessAria')}
          onClick={() => onAdjust(-15)}
          className={side}
        >
          {t('workouts.session.restLess')}
        </button>
        <button
          type="button"
          onClick={onReady}
          className="rounded-full bg-teal px-5.5 py-3 text-body font-semibold text-white transition-transform active:scale-95"
        >
          {t('workouts.session.ready')}
        </button>
        <button
          type="button"
          aria-label={t('workouts.session.restMoreAria')}
          onClick={() => onAdjust(15)}
          className={side}
        >
          {t('workouts.session.restMore')}
        </button>
      </div>
      {next ? (
        <p className="text-callout text-muted">
          <Trans
            text={t('workouts.session.nextLine')}
            values={{ what: <b className="font-semibold text-foreground">{next}</b> }}
          />
        </p>
      ) : null}
    </>
  )
}
