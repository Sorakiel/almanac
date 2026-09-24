import { DetailNote } from '@/features/progress/components/details/DetailNote'
import { FocusHeatmap } from '@/features/progress/components/FocusHeatmap'
import type { FocusPeriod } from '@/features/progress/lib/period'
import type { FocusDay } from '@/features/progress/types'
import { useT } from '@/hooks/useT'

interface FocusDetailProps {
  data: FocusPeriod & { heatmap: FocusDay[] }
}

/** The typical session, and the year of focus as a heatmap. */
export function FocusDetail({ data }: FocusDetailProps) {
  const { t } = useT()
  return (
    <>
      <DetailNote>
        {data.sessions > 0
          ? t('progress.focusNote', { m: data.average })
          : t('progress.nothingYet')}
      </DetailNote>
      <div className="overflow-x-auto">
        <FocusHeatmap days={data.heatmap} />
      </div>
    </>
  )
}
