import { FOCUS_CHIPS_MIN, isFocusChip } from '@/features/flow/lib/duration'
import { useT } from '@/hooks/useT'

interface DurationControlsProps {
  minutes: number
  onChange: (minutes: number) => void
  /** «Своё»: type a length on the dial's face. */
  onCustom: () => void
}

/**
 * 15 / 25 / 45 / 60 and «Своё» (prototype `.m-dur`). A length off the chips —
 * from the knob or typed on the dial — lights «Своё», which then reads it
 * («40 мин»); tapping «Своё» opens the field in the middle of the dial. Nothing
 * here appears or disappears while the knob turns, so the layout under the
 * dial keeps its height. The prototype's −5 / field / +5 stepper is gone at
 * the owner's request: it slid in and out under a dragging finger.
 */
export function DurationControls({ minutes, onChange, onCustom }: DurationControlsProps) {
  const { t } = useT()
  const custom = !isFocusChip(minutes)

  return (
    <>
      <div className="flow-chips" role="group" aria-label={t('flow.sessionLength')}>
        {FOCUS_CHIPS_MIN.map((m) => (
          <button
            key={m}
            type="button"
            className="flow-chip"
            aria-pressed={!custom && minutes === m}
            onClick={() => onChange(m)}
          >
            {t('flow.minutesShort', { count: m })}
          </button>
        ))}
        <button type="button" className="flow-chip" aria-pressed={custom} onClick={onCustom}>
          {custom ? t('flow.minutesShort', { count: minutes }) : t('flow.custom')}
        </button>
      </div>
      <p className="flow-hint">{t('flow.dragHint')}</p>
    </>
  )
}
