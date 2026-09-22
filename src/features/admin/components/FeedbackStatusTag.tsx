import { Tag } from '@/components/common/Tag'
import type { FeedbackStatus } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

const STATUS_TONE: Record<FeedbackStatus, 'accent' | 'teal' | 'amber' | 'muted'> = {
  open: 'amber',
  planned: 'accent',
  done: 'teal',
  closed: 'muted',
}

export function FeedbackStatusTag({
  status,
  className,
}: {
  status: FeedbackStatus
  className?: string
}) {
  const { t } = useT()
  return (
    <Tag tone={STATUS_TONE[status]} className={className}>
      {t(`admin.feedbackStatus.${status}`)}
    </Tag>
  )
}
