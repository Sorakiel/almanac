import { useRouteError } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Route-level error screen. The common cause is a stale lazy chunk after a
 * redeploy (the old hashed file 404s); a reload fetches the fresh index.html
 * and its new chunk names, so "Reload" is the primary action.
 */
export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'Something went wrong.'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-surface p-3">
        <RefreshCw className="h-6 w-6 text-accent" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">Something needs a refresh</p>
        <p className="max-w-sm text-sm text-muted">
          The app updated in the background. Reload to get the latest version.
        </p>
      </div>
      <Button onClick={() => window.location.reload()}>Reload</Button>
      <p className="max-w-md break-words font-mono text-[11px] text-muted-strong">{message}</p>
    </div>
  )
}
