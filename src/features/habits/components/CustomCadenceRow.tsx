import { CountStepper } from '@/features/habits/components/CountStepper'
import { InlineSelect } from '@/features/habits/components/InlineSelect'
import {
  FREQ_UNIT,
  UNIT_FREQ,
  UNIT_RANGE,
  clampToRange,
  type CadenceValue,
  type CustomUnit,
} from '@/features/habits/lib/cadence'
import { useT } from '@/hooks/useT'

const UNITS: CustomUnit[] = ['days', 'weeks', 'per_week']

interface CustomCadenceRowProps {
  value: CadenceValue
  onChange: (value: CadenceValue) => void
}

/** «Своё» in the edit sheet: every N days / weeks, or N times a week. */
export function CustomCadenceRow({ value, onChange }: CustomCadenceRowProps) {
  const { t } = useT()
  const unit = FREQ_UNIT[value.frequency] ?? 'days'
  return (
    <div className="mt-2 flex min-h-12 items-center gap-3 rounded-control bg-sheet-fill px-3.5 py-2">
      {unit !== 'per_week' ? (
        <span className="text-callout font-medium">{t('habits.form.every')}</span>
      ) : null}
      <CountStepper
        value={value.target_count}
        onChange={(n) => onChange({ ...value, target_count: n })}
        min={UNIT_RANGE[unit].min}
        max={UNIT_RANGE[unit].max}
      />
      <div className="ml-auto">
        <InlineSelect
          ariaLabel={t('habits.form.intervalUnit')}
          value={unit}
          onChange={(next) =>
            onChange({
              frequency: UNIT_FREQ[next],
              target_count: clampToRange(value.target_count, UNIT_RANGE[next]),
            })
          }
          options={UNITS.map((u) => ({ value: u, label: t(`habits.form.units.${u}`) }))}
        />
      </div>
    </div>
  )
}
