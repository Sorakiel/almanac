import { BarRow } from '@/features/progress/components/details/BarRow'
import { DetailNote } from '@/features/progress/components/details/DetailNote'
import type { WorkoutPeriod } from '@/features/progress/lib/period'
import { useT } from '@/hooks/useT'

/** The period's heaviest sets, scaled to the heaviest of them. */
export function WorkoutsDetail({ data }: { data: WorkoutPeriod }) {
  const { t } = useT()
  const [top] = data.records
  if (!top) return <DetailNote>{t('progress.nothingYet')}</DetailNote>
  return (
    <>
      {data.records.map((r) => (
        <BarRow
          key={r.name}
          label={r.name}
          value={r.weight / top.weight}
          display={t('units.kgValue', { value: r.weight })}
          color="rgb(var(--color-teal))"
        />
      ))}
      <DetailNote>
        {t('progress.recordNote', { name: top.name, weight: top.weight, reps: top.reps })}
      </DetailNote>
    </>
  )
}
