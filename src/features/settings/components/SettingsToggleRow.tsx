import type { LucideIcon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface SettingsToggleRowProps {
  icon: LucideIcon
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** An on/off setting that lives inline on a settings card — no sheet needed. */
export function SettingsToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  onCheckedChange,
}: SettingsToggleRowProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 py-3">
      <Icon
        className="h-4 w-4 flex-none translate-y-0.5 self-start text-muted"
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </label>
  )
}
