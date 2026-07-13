import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'

interface ReminderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current reminder preferences from the profile. */
  enabled: boolean
  hour: number
}

const HOURS = Array.from({ length: 24 }, (_, h) => h)

/**
 * Daily email-reminder settings. Almanac emails you around this LOCAL hour on
 * days you still have habits left to complete — the delivery runs server-side,
 * so it lands even when the app is closed.
 */
export function ReminderSheet({ open, onOpenChange, enabled, hour }: ReminderSheetProps) {
  const { update, isPending } = useUpdateProfile()
  const [on, setOn] = useState(enabled)
  const [selectedHour, setSelectedHour] = useState(hour)

  const dirty = on !== enabled || selectedHour !== hour

  const save = async () => {
    try {
      await update({ reminder_enabled: on, reminder_hour: selectedHour })
      toast.success(on ? 'Daily reminder on' : 'Daily reminder off')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update reminder')
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Daily reminder"
      description="Get a nudge by email on days you still have habits to finish."
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Email reminder</p>
            <p className="text-xs text-muted">Sent to your account email.</p>
          </div>
          <Switch checked={on} onCheckedChange={setOn} aria-label="Enable daily email reminder" />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Time</span>
          <select
            value={selectedHour}
            onChange={(event) => setSelectedHour(Number(event.target.value))}
            disabled={!on}
            className="w-full rounded-tile border bg-surface px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {reminderTimeLabel(h)}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">In your local timezone.</span>
        </label>

        <Button size="lg" onClick={save} disabled={isPending || !dirty}>
          {isPending ? 'Saving…' : 'Save reminder'}
        </Button>
      </div>
    </Sheet>
  )
}
