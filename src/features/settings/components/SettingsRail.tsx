import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { browserTimezone } from '@/lib/date'
import { APP_VERSION } from '@/lib/version'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="flex-none text-muted">{label}</span>
      <span className="min-w-0 truncate text-right font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop Settings context rail: Almanac identity + account meta. */
export function SettingsRail() {
  const { t, locale } = useT()
  const { user } = useSession()
  const { profile } = useProfile()
  const { logOut } = useAuthActions()

  // Month names have to follow the interface language, not the build locale.
  const joined = user?.created_at
    ? new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
        new Date(user.created_at),
      )
    : '—'
  const role =
    profile?.role === 'owner'
      ? t('rail.owner')
      : profile?.role === 'admin'
        ? t('rail.admin')
        : t('rail.member')

  const handleSignOut = async () => {
    try {
      await logOut.mutateAsync()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.signOut'))
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/15 text-[17px] text-accent"
        >
          ◇
        </span>
        <div>
          <p className="text-[15px] font-semibold">The Almanac</p>
          <p className="font-mono text-[10px] text-muted-strong">
            v{APP_VERSION} · {t('rail.commandCenter')}
          </p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {t('rail.account')}
        </p>
        <div className="mt-2 flex flex-col">
          <Row label={t('rail.role')} value={role} />
          <Row label={t('rail.joined')} value={joined} />
          <Row label={t('rail.timezone')} value={browserTimezone()} />
        </div>
      </div>

      <p className="px-1 text-[13px] italic leading-relaxed text-muted">{t('rail.motto')}</p>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleSignOut}
        disabled={logOut.isPending}
      >
        {t('settings.signOut')}
      </Button>
    </div>
  )
}
