import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useT } from '@/hooks/useT'

interface ErrorStateProps {
  title: string
  onRetry: () => void
}

/** A failed load with a retry button — the error view of every data page. */
export function ErrorState({ title, onRetry }: ErrorStateProps) {
  const { t } = useT()
  return (
    <EmptyState
      icon={RefreshCw}
      title={title}
      description={t('common.loadFailedHint')}
      action={
        <Button size="sm" variant="surface" onClick={onRetry}>
          {t('common.tryAgain')}
        </Button>
      }
    />
  )
}
