import { useId, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import {
  DURATION_PRESETS_MIN,
  FOCUS_STEP_MIN,
  MAX_FOCUS_MIN,
  MIN_FOCUS_MIN,
  clampFocusMinutes,
} from '@/features/flow/lib/duration'

interface DurationPickerProps {
  value: number
  onChange: (minutes: number) => void
}

const CHIP =
  'flex-1 rounded-tile border py-3 font-mono text-sm tracking-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
const STEP_BUTTON =
  'flex h-11 w-11 flex-none items-center justify-center rounded-tile border text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40'

/** Preset lengths plus a "custom" chip that opens a − [minutes] + stepper. */
export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const { t } = useT()
  const isPreset = (DURATION_PRESETS_MIN as readonly number[]).includes(value)
  const [custom, setCustom] = useState(!isPreset)
  // The field keeps its own text so a half-typed "1" isn't clamped to 5 mid-keystroke.
  const [draft, setDraft] = useState(String(value))
  const rangeId = useId()

  const commit = (next: number) => {
    const minutes = clampFocusMinutes(next, value)
    setDraft(String(minutes))
    onChange(minutes)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2" role="radiogroup" aria-label={t('flow.sessionLength')}>
        {DURATION_PRESETS_MIN.map((min) => {
          const checked = !custom && value === min
          return (
            <button
              key={min}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => {
                setCustom(false)
                commit(min)
              }}
              className={cn(
                CHIP,
                checked
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {t('flow.minutesShort', { count: min })}
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          onClick={() => setCustom(true)}
          className={cn(
            CHIP,
            custom ? 'border-accent bg-accent/15 text-accent' : 'text-muted hover:text-foreground',
          )}
        >
          {t('flow.custom')}
        </button>
      </div>

      {custom ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={STEP_BUTTON}
            aria-label={t('flow.shorter', { count: FOCUS_STEP_MIN })}
            disabled={value <= MIN_FOCUS_MIN}
            onClick={() => commit(value - FOCUS_STEP_MIN)}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-tile border bg-surface px-3 focus-within:ring-2 focus-within:ring-accent">
            <input
              type="number"
              inputMode="numeric"
              min={MIN_FOCUS_MIN}
              max={MAX_FOCUS_MIN}
              step={1}
              value={draft}
              aria-label={t('flow.customAria')}
              aria-describedby={rangeId}
              onChange={(event) => {
                setDraft(event.target.value)
                const parsed = Number(event.target.value)
                if (parsed >= MIN_FOCUS_MIN && parsed <= MAX_FOCUS_MIN) onChange(Math.round(parsed))
              }}
              onBlur={() => commit(Number(draft))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commit(Number(draft))
              }}
              className="w-full min-w-0 bg-transparent text-center font-mono text-lg tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="label-mono flex-none">{t('flow.minUnit')}</span>
          </label>
          <button
            type="button"
            className={STEP_BUTTON}
            aria-label={t('flow.longer', { count: FOCUS_STEP_MIN })}
            disabled={value >= MAX_FOCUS_MIN}
            onClick={() => commit(value + FOCUS_STEP_MIN)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {custom ? (
        <p id={rangeId} className="text-xs text-muted">
          {t('flow.customRange', { min: MIN_FOCUS_MIN, max: MAX_FOCUS_MIN })}
        </p>
      ) : null}
    </div>
  )
}
