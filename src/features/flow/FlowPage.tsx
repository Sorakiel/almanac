import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { SectionHead } from '@/features/workouts/components/SectionHead'
import { DurationControls } from '@/features/flow/components/DurationControls'
import { FlowReadingRunner } from '@/features/flow/components/FlowReadingRunner'
import { FocusDial } from '@/features/flow/components/FocusDial'
import { FocusRecent } from '@/features/flow/components/FocusRecent'
import {
  FocusTargetSheet,
  type FocusTargetChoice,
} from '@/features/flow/components/FocusTargetSheet'
import { FocusWeek } from '@/features/flow/components/FocusWeek'
import { useFinishFocus } from '@/features/flow/hooks/useFinishFocus'
import { useFocusWeek } from '@/features/flow/hooks/useFocusWeek'
import { FOCUS_GOAL_MIN, isFocusChip } from '@/features/flow/lib/duration'
import { focusMinutesOn } from '@/features/flow/lib/week'
import { useNow } from '@/hooks/useNow'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { focusMsLeft, useFocusStore } from '@/stores/focus'
import '@/features/flow/flow.css'

/** The length the dial opens on. */
const DEFAULT_MIN = 25

/**
 * Flow (v0.6 §2.8, prototype `MOD.focus` / `.dk-focus`): a watch face with
 * sand inside. Idle — pick a length (chips, «Своё», the knob or typing on the
 * time) and what it's for, then «Начать». Running — the arc drains, Пауза /
 * Завершить. Below or beside: the week's bars and the latest blocks.
 */
function FlowPage() {
  const { t } = useT()
  const { dateKey, timezone } = useToday()
  const { endsAt, durationMin, label, bookId, pausedAt, start, pause, resume } = useFocusStore()
  const running = endsAt !== null && durationMin !== null
  const now = useNow(running && pausedAt === null)
  const { finishEarly } = useFinishFocus(now)
  const week = useFocusWeek()
  const [minutes, setMinutes] = useState(DEFAULT_MIN)
  const [custom, setCustom] = useState(false)
  const [target, setTarget] = useState<FocusTargetChoice | null>(null)
  const [picking, setPicking] = useState(false)

  const todayMin = focusMinutesOn(week.rows, dateKey)
  const secondsLeft = running ? focusMsLeft({ endsAt, pausedAt }, now) / 1000 : null
  const pick = (next: number, isCustom: boolean) => {
    setMinutes(next)
    setCustom(isCustom || !isFocusChip(next))
  }

  const dialbox = (
    <div className="flow-dialbox w-full">
      <FocusDial
        minutes={running ? durationMin : minutes}
        secondsLeft={secondsLeft}
        paused={pausedAt !== null}
        caption={label ?? t('flow.defaultSessionLabel')}
        onPick={(m) => pick(m, !isFocusChip(m))}
      />
      {running ? (
        <div className="flow-row2">
          <button
            type="button"
            className="flow-cta is-ghost"
            onClick={pausedAt === null ? pause : resume}
          >
            {pausedAt === null ? t('flow.pause') : t('flow.resume')}
          </button>
          <button type="button" className="flow-cta is-accent" onClick={finishEarly}>
            {t('flow.end')}
          </button>
        </div>
      ) : (
        <>
          <DurationControls minutes={minutes} custom={custom} onChange={pick} />
          <button type="button" className="flow-target" onClick={() => setPicking(true)}>
            <span className="flow-target-ic" aria-hidden="true">
              <Sparkles />
            </span>
            <span className="min-w-0 flex-1">
              <small>{t('flow.targetLabel')}</small>
              <b>{target?.label ?? t('flow.targetNone')}</b>
            </span>
            <span className="flow-target-go">
              {t('flow.targetChange')}
              <ChevronRight aria-hidden="true" />
            </span>
          </button>
          <button
            type="button"
            className="flow-cta is-accent"
            onClick={() =>
              start(minutes, target?.label, {
                habitId: target?.kind === 'habit' ? target.id : null,
                bookId: target?.kind === 'book' ? target.id : null,
              })
            }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            {t('flow.startFor', { count: minutes })}
          </button>
        </>
      )}
      {running && bookId ? (
        <FlowReadingRunner bookId={bookId} minutes={durationMin} onFinish={finishEarly} />
      ) : null}
    </div>
  )

  return (
    <div className="w-full">
      <header className="mx-0.5 mb-4 mt-2">
        <p className="text-callout font-medium text-muted">
          {t('flow.todayOf', { count: todayMin, goal: FOCUS_GOAL_MIN })}
        </p>
        <h1 className="text-large-title font-bold tracking-title">{t('flow.title')}</h1>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-module">
        <div className="grid min-w-0 justify-items-center lg:rounded-card lg:bg-surface lg:p-7">
          {dialbox}
        </div>
        <aside className="grid min-w-0 content-start gap-3.5 lg:sticky lg:top-toolbar-clearance">
          {week.isError ? (
            <ErrorState title={t('flow.weekFailed')} onRetry={week.refetch} />
          ) : (
            <>
              <section>
                <div className="lg:hidden">
                  <SectionHead>{t('flow.rhythm')}</SectionHead>
                </div>
                <FocusWeek rows={week.rows} todayKey={dateKey} />
              </section>
              <section>
                <SectionHead>{t('flow.recent')}</SectionHead>
                <FocusRecent rows={week.rows} todayKey={dateKey} timezone={timezone} />
              </section>
            </>
          )}
        </aside>
      </div>

      <FocusTargetSheet
        open={picking}
        onOpenChange={setPicking}
        value={target}
        onPick={setTarget}
      />
    </div>
  )
}

export default FlowPage
