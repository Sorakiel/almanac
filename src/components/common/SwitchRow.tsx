import { Switch } from '@/components/ui/switch'

interface SwitchRowProps {
  title: string
  hint: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  'aria-label': string
}

/** A titled on/off setting: label and hint on the left, the switch on the right. */
export function SwitchRow({
  title,
  hint,
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
}: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={ariaLabel} />
    </div>
  )
}
