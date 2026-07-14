import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { clearScheduledReminders, requestNotifyPermission } from '@/lib/notify'

interface ReminderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current reminder preferences from the profile. */
  enabled: boolean
  hour: number
}

const HOURS = Array.from({ length: 24 }, (_, h) => h)

/**
 * Daily reminder settings. Almanac sends a device notification around this LOCAL
 * hour on days you still have habits left to complete. On mobile the OS delivers
 * it even when the app is closed; on desktop it fires while the app is running.
 */
export function ReminderSheet({ open, onOpenChange, enabled, hour }: ReminderSheetProps) {
  const { update, isPending } = useUpdateProfile()
  const [on, setOn] = useState(enabled)
  const [selectedHour, setSelectedHour] = useState(hour)

  const dirty = on !== enabled || selectedHour !== hour

  const save = async () => {
    try {
      // Enabling needs OS permission; if it's refused, save anyway and let the
      // user grant it later from system settings rather than blocking the toggle.
      if (on) {
        const granted = await requestNotifyPermission()
        if (!granted) {
          toast.error('Allow notifications for Almanac in your system settings to get reminders.')
        }
      } else {
        await clearScheduledReminders()
      }
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
      description="Get a notification on days you still have habits to finish."
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Push notification</p>
            <p className="text-xs text-muted">Sent to this device.</p>
          </div>
          <Switch checked={on} onCheckedChange={setOn} aria-label="Enable daily reminder" />
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
