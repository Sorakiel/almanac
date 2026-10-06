import { FOCUS_CHIPS_MIN, isFocusChip } from '@/features/flow/lib/duration'
import { useT } from '@/hooks/useT'

interface DurationControlsProps {
  minutes: number
  onChange: (minutes: number) => void
  /** «Своё»: focus the field on the dial's face — the length itself stays. */
  onCustom: () => void
}

/**
 * 15 / 25 / 45 / 60 and «Своё» (prototype `.m-dur`). A length off the chips —
 * from the knob or typed on the dial — lights «Своё»; the number itself shows
 * on the dial and in «Начать · N мин», never in the chip, so no label ever
 * changes and the row keeps every chip's width and place under a dragging
 * finger. Tapping «Своё» opens the field in the middle of the dial. The
 * prototype's −5 / field / +5 stepper is gone at the owner's request: it slid
 * in and out while the knob turned.
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
          {t('flow.custom')}
        </button>
      </div>
      <p className="flow-hint">{t('flow.dragHint')}</p>
    </>
  )
}
