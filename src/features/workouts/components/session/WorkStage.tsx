import { Trans } from '@/components/common/Trans'
import {
  formatKg,
  REPS_STEP,
  WEIGHT_STEP,
  type SetValues,
} from '@/features/workouts/lib/sessionRun'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

interface WorkStageProps {
  exerciseName: string
  /** 0-based set within the exercise. */
  setIndex: number
  setTotal: number
  values: SetValues
  last: SetValues | null
  record: boolean
  onAdjust: (field: keyof SetValues, delta: number) => void
  onDone: () => void
  /** The tap landed: the button turns green for the beat before rest. */
  justDone: boolean
}

function Stepper({
  value,
  unit,
  less,
  more,
  onLess,
  onMore,
}: {
  value: string
  unit: string
  less: string
  more: string
  onLess: () => void
  onMore: () => void
}) {
  const btn =
    'h-9 w-11 rounded-full bg-sheet-fill text-headline font-medium transition-transform active:scale-90'
  return (
    <div className="grid min-w-30 grid-cols-2 justify-items-center gap-2">
      <div className="col-span-2 grid justify-items-center">
        <b className="num text-stage font-medium lg:text-stage-lg">{value}</b>
        <small className="text-footnote font-medium text-muted">{unit}</small>
      </div>
      <button type="button" aria-label={less} onClick={onLess} className={btn}>
        −
      </button>
      <button type="button" aria-label={more} onClick={onMore} className={btn}>
        +
      </button>
    </div>
  )
}

/** One set at a time (`wStage`, Work): the numbers, their steppers, last time, done. */
export function WorkStage({
  exerciseName,
  setIndex,
  setTotal,
  values,
  last,
  record,
  onAdjust,
  onDone,
  justDone,
}: WorkStageProps) {
  const { t, locale } = useT()
  const kg = (v: number) => formatKg(v, intlLocale(locale))
  return (
    <>
      <h2 className="text-title font-bold leading-tight tracking-title">{exerciseName}</h2>
      <p className="-mt-1.5 text-callout font-medium text-muted">
        <Trans
          text={t('workouts.session.setOf', { total: setTotal })}
          values={{ n: <b className="text-foreground">{setIndex + 1}</b> }}
        />
      </p>
      <div className="flex w-full items-center justify-center gap-1">
        <Stepper
          value={kg(values.weight)}
          unit={t('workouts.session.kg')}
          less={t('workouts.session.weightLess')}
          more={t('workouts.session.weightMore')}
          onLess={() => onAdjust('weight', -WEIGHT_STEP)}
          onMore={() => onAdjust('weight', WEIGHT_STEP)}
        />
        <span aria-hidden="true" className="-mt-7 text-title font-light text-muted-strong">
          ×
        </span>
        <Stepper
          value={String(values.reps)}
          unit={t('workouts.session.reps')}
          less={t('workouts.session.repsLess')}
          more={t('workouts.session.repsMore')}
          onLess={() => onAdjust('reps', -REPS_STEP)}
          onMore={() => onAdjust('reps', REPS_STEP)}
        />
      </div>
      {last ? (
        <p className="flex flex-wrap items-center justify-center gap-1.5 text-footnote text-muted">
          {t('workouts.session.lastTime', { weight: kg(last.weight), reps: last.reps })}
          {record ? (
            <span className="rounded-full bg-amber/20 px-1.75 py-0.5 text-caption font-semibold text-amber">
              {t('workouts.session.record')}
            </span>
          ) : null}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onDone}
        disabled={justDone}
        className={cn(
          'ws-done h-14.5 w-full rounded-full text-body font-semibold text-white transition duration-200 active:scale-97 lg:max-w-105',
          justDone ? 'scale-96 bg-success' : 'bg-teal',
        )}
      >
        {t('workouts.session.setDone')}
      </button>
    </>
  )
}
