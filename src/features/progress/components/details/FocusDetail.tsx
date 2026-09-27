import { DetailNote } from '@/features/progress/components/details/DetailNote'
import type { FocusPeriod } from '@/features/progress/lib/period'
import { useT } from '@/hooks/useT'

interface FocusDetailProps {
  data: FocusPeriod
}

/**
 * One line, as in the desktop prototype's focus card: the best time of day
 * and the typical session. No heatmap — the card has no room for one.
 */
export function FocusDetail({ data }: FocusDetailProps) {
  const { t } = useT()
  if (data.sessions === 0) return <DetailNote>{t('progress.nothingYet')}</DetailNote>
  return (
    <DetailNote>
      {data.bestPart
        ? t('progress.focusBest', {
            part: t(`progress.dayParts.${data.bestPart}`),
            m: data.average,
          })
        : t('progress.focusNote', { m: data.average })}
    </DetailNote>
  )
}
