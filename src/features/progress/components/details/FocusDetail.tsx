import { DetailNote } from '@/features/progress/components/details/DetailNote'
import { FocusHeatmap } from '@/features/progress/components/FocusHeatmap'
import type { FocusPeriod } from '@/features/progress/lib/period'
import type { FocusDay } from '@/features/progress/types'
import { useT } from '@/hooks/useT'

// A card is too narrow for the full year: half of it fills the width with
// readable cells and never scrolls. A multiple of 7 keeps week columns whole.
const CARD_DAYS = 26 * 7

interface FocusDetailProps {
  data: FocusPeriod & { heatmap: FocusDay[] }
}

/** The typical session, and the last half-year of focus as a heatmap. */
export function FocusDetail({ data }: FocusDetailProps) {
  const { t } = useT()
  return (
    <>
      <DetailNote>
        {data.sessions > 0
          ? t('progress.focusNote', { m: data.average })
          : t('progress.nothingYet')}
      </DetailNote>
      <FocusHeatmap days={data.heatmap.slice(-CARD_DAYS)} fill />
    </>
  )
}
