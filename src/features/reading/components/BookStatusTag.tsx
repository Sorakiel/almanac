import { Tag } from '@/components/common/Tag'
import { statusLabel } from '@/features/reading/lib/progress'
import type { BookStatus } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

const STATUS_TONE: Record<BookStatus, 'muted' | 'accent' | 'teal'> = {
  to_read: 'muted',
  reading: 'accent',
  finished: 'teal',
}

interface BookStatusTagProps {
  status: BookStatus
  className?: string
}

export function BookStatusTag({ status, className }: BookStatusTagProps) {
  const { t } = useT()
  return (
    <Tag tone={STATUS_TONE[status]} className={className}>
      {statusLabel(status, t)}
    </Tag>
  )
}
