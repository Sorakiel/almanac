import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { ErrorState } from '@/components/common/ErrorState'
import { Sheet } from '@/components/ui/sheet'
import { AppIcon } from '@/features/connect/components/AppIcon'
import type { ConnectedApp } from '@/features/connect/api/connect.api'
import { useConnectedApps, useDisconnectApp } from '@/features/connect/hooks/useConnect'
import { scopeLabel } from '@/features/connect/lib/scopes'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface ConnectedAppsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Profile → Connected apps: who can sign in as you, with what, and "Disconnect". */
export function ConnectedAppsSheet({ open, onOpenChange }: ConnectedAppsSheetProps) {
  const { t, locale } = useT()
  const apps = useConnectedApps(open)
  const disconnect = useDisconnectApp()
  const [confirming, setConfirming] = useState<ConnectedApp | null>(null)

  const date = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium' }).format(new Date(iso))

  const onDisconnect = () => {
    if (!confirming) return
    const app = confirming
    disconnect.mutate(app.client_id, {
      onSuccess: () => {
        setConfirming(null)
        toast.success(t('connect.disconnected', { app: app.name }))
      },
      onError: (error) => toast.error(toUserError(error, t, 'connect.disconnectFailed')),
    })
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('connect.appsTitle')}
        description={t('connect.appsDescription')}
      >
        {apps.isLoading ? (
          <p className="text-footnote text-muted">{t('connect.appsLoading')}</p>
        ) : apps.isError ? (
          <ErrorState title={t('connect.appsFailed')} onRetry={() => void apps.refetch()} />
        ) : !apps.data?.length ? (
          <p className="text-footnote text-muted">{t('connect.appsEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {apps.data.map((app) => (
              <li
                key={app.client_id}
                className="flex items-start gap-3 rounded-card bg-surface p-3"
              >
                <AppIcon name={app.name} iconUrl={app.icon_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold">{app.name}</p>
                  <p className="text-footnote text-muted">
                    {t('connect.connectedOn', { date: date(app.connected_at) })}
                  </p>
                  <p className="mt-1 text-footnote text-muted">
                    {app.scopes.map((s) => scopeLabel(s, t)).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirming(app)}
                  className="flex-none rounded-control px-2 py-1 text-callout font-medium text-danger hover:bg-foreground/5"
                >
                  {t('connect.disconnect')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      <ConfirmSheet
        open={confirming !== null}
        onOpenChange={(next) => {
          if (!next) setConfirming(null)
        }}
        title={t('connect.disconnectTitle', { app: confirming?.name ?? '' })}
        description={t('connect.disconnectBody')}
        confirmLabel={t('connect.disconnect')}
        pending={disconnect.isPending}
        onConfirm={onDisconnect}
      />
    </>
  )
}
