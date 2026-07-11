import { ShieldCheck } from 'lucide-react'

/** Desktop Admin context rail: elevated-access identity and a caution note. */
export function AdminRail() {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/15 text-accent"
        >
          <ShieldCheck className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Admin</p>
          <p className="font-mono text-[10px] text-muted-strong">workspace tools</p>
        </div>
      </div>

      <div className="rounded-[18px] border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-accent">
          elevated access
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          You can view and manage the whole workspace. Cross-user actions bypass the usual isolation
          — use them carefully.
        </p>
      </div>
    </div>
  )
}
