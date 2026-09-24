import { DetailNote } from '@/features/progress/components/details/DetailNote'
import type { ReflectPeriod } from '@/features/progress/lib/period'
import { useT } from '@/hooks/useT'

/** How many of the period's days got an entry. */
export function ReflectDetail({ data, days }: { data: ReflectPeriod; days: number }) {
  const { t } = useT()
  return (
    <DetailNote>
      {data.entries > 0
        ? t('progress.reflectNote', { days: data.days, total: days })
        : t('progress.nothingYet')}
    </DetailNote>
  )
}
