import { useState } from 'react'
import {
  FOCUS_CHIPS_MIN,
  FOCUS_STEP_MIN,
  MAX_FOCUS_MIN,
  MIN_FOCUS_MIN,
  clampFocusMinutes,
  isFocusChip,
} from '@/features/flow/lib/duration'
import { useT } from '@/hooks/useT'

interface DurationControlsProps {
  minutes: number
  /** «Своё» is open: the stepper shows, and the chip reads the length. */
  custom: boolean
  onChange: (minutes: number, custom: boolean) => void
}

/**
 * 15 / 25 / 45 / 60 and «Своё» (prototype `.m-dur` + `.m-fstep`): «Своё» opens
 * −5 / field / +5 within 5–180 and then reads as the length it holds.
 */
export function DurationControls({ minutes, custom, onChange }: DurationControlsProps) {
  const { t } = useT()
  const customOn = custom || !isFocusChip(minutes)

  return (
    <>
      <div className="flow-chips" role="group" aria-label={t('flow.sessionLength')}>
        {FOCUS_CHIPS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            className="flow-chip"
            aria-pressed={!customOn && minutes === m}
            onClick={() => onChange(m, false)}
          >
            {t('flow.minutesShort', { count: m })}
          </button>
        ))}
        <button
          type="button"
          className="flow-chip"
          aria-pressed={customOn}
          onClick={() => onChange(minutes, true)}
        >
          {customOn ? t('flow.minutesShort', { count: minutes }) : t('flow.custom')}
        </button>
      </div>
      {custom ? <Stepper minutes={minutes} onChange={(m) => onChange(m, true)} /> : null}
    </>
  )
}

function Stepper({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  const { t } = useT()
  // Its own text, so a half-typed "1" isn't clamped to 5 mid-keystroke.
  const [draft, setDraft] = useState<string | null>(null)
  const step = (delta: number) => {
    setDraft(null)
    onChange(clampFocusMinutes(minutes + delta, minutes))
  }
  return (
    <>
      <div className="flow-step">
        <button
          type="button"
          onClick={() => step(-FOCUS_STEP_MIN)}
          disabled={minutes <= MIN_FOCUS_MIN}
          aria-label={t('flow.shorter', { count: FOCUS_STEP_MIN })}
        >
          −{FOCUS_STEP_MIN}
        </button>
        <label>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_FOCUS_MIN}
            max={MAX_FOCUS_MIN}
            step={FOCUS_STEP_MIN}
            value={draft ?? String(minutes)}
            aria-label={t('flow.customAria')}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              setDraft(e.target.value)
              const v = Number.parseInt(e.target.value, 10)
              if (v >= MIN_FOCUS_MIN && v <= MAX_FOCUS_MIN) onChange(v)
            }}
            onBlur={() => {
              if (draft !== null) onChange(clampFocusMinutes(Number.parseInt(draft, 10), minutes))
              setDraft(null)
            }}
          />
          {t('flow.minUnit')}
        </label>
        <button
          type="button"
          onClick={() => step(FOCUS_STEP_MIN)}
          disabled={minutes >= MAX_FOCUS_MIN}
          aria-label={t('flow.longer', { count: FOCUS_STEP_MIN })}
        >
          +{FOCUS_STEP_MIN}
        </button>
      </div>
      <p className="flow-hint">{t('flow.dragHint')}</p>
    </>
  )
}
