import { useState } from 'react'
import { ChipGroup } from '@/features/habits/components/ChipGroup'
import { CountStepper } from '@/features/habits/components/CountStepper'
import {
  GOAL_MAX,
  GOAL_MIN,
  GOAL_PRESETS,
  ONCE,
  UNIT_MAX,
  goalMode,
  isKnownUnit,
  unitLabel,
  type Goal,
  type GoalMode,
} from '@/features/habits/lib/goal'
import { useT } from '@/hooks/useT'

interface GoalFieldProps {
  value: Goal
  onChange: (value: Goal) => void
  /** The caption class of the form it sits in, so the section reads as one of its own. */
  labelClassName: string
}

/**
 * "How much a day": once, a preset ("8 glasses") or the user's own amount and
 * word. The chip follows the value, so a form that fills in after mounting
 * (the edit sheet resets once its habit arrives) shows the right one; only
 * an explicit "Custom" is remembered, since its numbers may equal a preset's.
 */
export function GoalField({ value, onChange, labelClassName }: GoalFieldProps) {
  const { t } = useT()
  const [customPinned, setCustomPinned] = useState(false)
  const mode: GoalMode = customPinned ? 'custom' : goalMode(value)

  const pick = (next: GoalMode) => {
    setCustomPinned(next === 'custom')
    if (next === 'once') onChange(ONCE)
    else if (next === 'custom') onChange({ goal: Math.max(value.goal, 2), unit: value.unit })
    else {
      const preset = GOAL_PRESETS.find((p) => p.key === next)!
      onChange({ goal: preset.goal, unit: preset.unit })
    }
  }

  // A known key is shown translated; typing replaces it with the user's word.
  const typedUnit = isKnownUnit(value.unit)
    ? unitLabel(value.unit, value.goal, t)
    : (value.unit ?? '')

  return (
    <>
      <span className={labelClassName}>{t('habits.goal.label')}</span>
      <ChipGroup
        label={t('habits.goal.label')}
        value={mode}
        onChange={pick}
        options={[
          { value: 'once', label: t('habits.goal.once') },
          ...GOAL_PRESETS.map((p) => ({ value: p.key, label: t(`habits.goal.presets.${p.key}`) })),
          { value: 'custom', label: t('habits.goal.custom') },
        ]}
      />
      {mode === 'once' ? null : (
        <div className="mt-2.5 flex items-center gap-2.5">
          <CountStepper
            value={value.goal}
            min={GOAL_MIN}
            max={GOAL_MAX}
            onChange={(goal) => onChange({ ...value, goal })}
          />
          {mode === 'custom' ? (
            <input
              aria-label={t('habits.goal.unit')}
              maxLength={UNIT_MAX}
              value={typedUnit}
              onChange={(event) => onChange({ ...value, unit: event.target.value || null })}
              placeholder={t('habits.goal.unitPlaceholder')}
              className="h-11 min-w-0 flex-1 rounded-control bg-sheet-fill px-3.5 text-body text-foreground placeholder:text-muted-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            />
          ) : (
            <span className="text-callout text-muted">{unitLabel(value.unit, value.goal, t)}</span>
          )}
        </div>
      )}
    </>
  )
}
