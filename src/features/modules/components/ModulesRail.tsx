import { useModulesStore } from '@/stores/modules'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="flex-none text-muted">{label}</span>
      <span className="min-w-0 truncate text-right font-mono tabular-nums">{value}</span>
    </div>
  )
}

/** Desktop Modules context rail: hub identity + overview counts. */
export function ModulesRail() {
  const enabled = useModulesStore((s) => s.enabled)
  const active = Object.values(enabled).filter(Boolean).length

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
          <p className="text-[15px] font-semibold">Modules</p>
          <p className="font-mono text-[10px] text-muted-strong">your command center</p>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">overview</p>
        <div className="mt-2 flex flex-col">
          <Row label="in your nav" value={String(active)} />
          <Row label="coming soon" value="4" />
        </div>
      </div>

      <p className="px-1 text-[13px] italic leading-relaxed text-muted">
        Almanac grows with you — one module at a time.
      </p>
    </div>
  )
}
