import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/hooks/useT'
import { trackError } from '@/lib/analytics'

/**
 * Route-level error screen. The common cause is a stale lazy chunk after a
 * redeploy (the old hashed file 404s); a reload fetches the fresh index.html
 * and its new chunk names, so "Reload" is the primary action.
 */
export function RouteError() {
  const { t } = useT()
  const error = useRouteError()
  const message = error instanceof Error ? error.message : t('common.routeErrorGeneric')

  useEffect(() => {
    trackError(error, 'route-error')
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-surface p-3">
        <RefreshCw className="h-6 w-6 text-accent" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">{t('common.routeErrorTitle')}</p>
        <p className="max-w-sm text-sm text-muted">{t('common.routeErrorStale')}</p>
      </div>
      <Button onClick={() => window.location.reload()}>{t('common.reload')}</Button>
      <p className="max-w-md break-words font-mono text-[11px] text-muted-strong">{message}</p>
    </div>
  )
}
