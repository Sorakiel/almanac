import { format } from 'date-fns'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useSession } from '@/hooks/useSession'
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
  const { user } = useSession()
  const { profile } = useProfile()

  const joined = user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '—'
  const role = profile?.role === 'admin' ? 'Admin' : 'Member'

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
          <p className="font-mono text-[10px] text-muted-strong">v{APP_VERSION} · command center</p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">account</p>
        <div className="mt-2 flex flex-col">
          <Row label="member" value={role} />
          <Row label="joined" value={joined} />
          <Row label="timezone" value={browserTimezone()} />
        </div>
      </div>

      <p className="px-1 text-[13px] italic leading-relaxed text-muted">
        Discipline is a practice, not a destination.
      </p>
    </div>
  )
}
