import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { AppIcon } from '@/features/connect/components/AppIcon'
import { useDecideOAuthRequest, useOAuthRequest } from '@/features/connect/hooks/useConnect'
import { clearPendingRequest, readPendingRequest } from '@/features/connect/lib/pendingRequest'
import { scopeLabel } from '@/features/connect/lib/scopes'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/**
 * "Sign in with Almanac" consent, over whatever screen the signed-in shell
 * opened on. Mounted once in AppLayout; idle unless an app sent the user here
 * (see lib/pendingRequest). An app the user already allowed these permissions
 * is approved without asking again. Either answer sends the browser back to
 * the app's redirect_uri — a refusal too, so the app stops waiting.
 */
export function ConsentHost() {
  const { t } = useT()
  const [id, setId] = useState(readPendingRequest)
  const request = useOAuthRequest(id)
  const decide = useDecideOAuthRequest()
  const [leaving, setLeaving] = useState(false)
  const autoSent = useRef(false)

  const answer = (approve: boolean) => {
    if (!id || decide.isPending || leaving) return
    decide.mutate(
      { id, approve },
      {
        onSuccess: (redirectUrl) => {
          clearPendingRequest()
          setLeaving(true)
          window.location.assign(redirectUrl)
        },
        onError: (error) => {
          clearPendingRequest()
          setId(null)
          toast.error(toUserError(error, t, 'connect.failed'))
        },
      },
    )
  }

  // Effects react to the request's outcome; the fetch itself is React Query's.
  useEffect(() => {
    if (!request.isError) return
    clearPendingRequest()
    toast.error(t('connect.expired'))
  }, [request.isError, t])

  useEffect(() => {
    if (!request.data?.auto || autoSent.current) return
    autoSent.current = true
    answer(true)
    // answer is recreated each render; the ref makes this fire once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.data?.auto])

  const details = request.data
  if (!id || request.isError || !details || details.auto) return null
  const appName = details.client.name

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) answer(false)
      }}
      title={t('connect.title', { app: appName })}
      description={t('connect.description', { app: appName })}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <AppIcon name={appName} iconUrl={details.client.icon_url} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-headline font-semibold">{appName}</p>
            {details.email ? (
              <p className="truncate text-footnote text-muted">
                {t('connect.account', { email: details.email })}
              </p>
            ) : null}
          </div>
        </div>

        <section aria-label={t('connect.permissions')}>
          <h3 className="mb-2 text-footnote font-semibold text-muted">
            {t('connect.permissions')}
          </h3>
          <ul className="overflow-hidden rounded-card bg-surface [&>*+*]:border-t [&>*+*]:border-border/10">
            {details.scopes.map((scope) => (
              <li key={scope} className="flex min-h-12 items-center gap-3 px-4 text-body">
                <Check className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
                {scopeLabel(scope, t)}
              </li>
            ))}
          </ul>
          <p className="mx-1 mt-2 text-footnote leading-snug text-muted">
            {t('connect.revokeNote')}
          </p>
        </section>

        {leaving ? (
          <p role="status" className="text-center text-callout text-muted">
            {t('connect.returning', { app: appName })}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Button size="lg" disabled={decide.isPending} onClick={() => answer(true)}>
              {t('connect.allow')}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              disabled={decide.isPending}
              onClick={() => answer(false)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
