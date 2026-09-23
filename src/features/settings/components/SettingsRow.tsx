import { ChevronRight, type LucideIcon } from 'lucide-react'

interface SettingsRowProps {
  icon: LucideIcon
  label: string
  value?: string
  onClick: () => void
}

/** A tappable settings row: icon, label, current value, chevron. */
export function SettingsRow({ icon: Icon, label, value, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-4 flex min-h-12 items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-card last:rounded-b-card hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <Icon className="h-4 w-4 flex-none text-muted" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value ? (
        <span className="label-mono max-w-[45%] truncate normal-case tracking-normal">{value}</span>
      ) : null}
      <ChevronRight className="h-4 w-4 flex-none text-muted-strong" aria-hidden="true" />
    </button>
  )
}
