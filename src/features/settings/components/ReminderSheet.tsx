import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { REMINDER_PRESETS, reminderTimeLabel } from '@/features/settings/lib/reminder'
import { clearScheduledReminders, requestNotifyPermission } from '@/lib/notify'
import { cn } from '@/lib/utils'

interface ReminderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current reminder preferences from the profile. */
  enabled: boolean
  hour: number
  minute: number
}

/**
 * Daily reminder settings. Almanac sends a device notification at this LOCAL
 * time on days you still have habits left to complete. On mobile the OS delivers
 * it even when the app is closed; on desktop it fires while the app is running.
 */
export function ReminderSheet({ open, onOpenChange, enabled, hour, minute }: ReminderSheetProps) {
  const { update, isPending } = useUpdateProfile()
  const [on, setOn] = useState(enabled)
  const [selectedHour, setSelectedHour] = useState(hour)
  const [selectedMinute, setSelectedMinute] = useState(minute)

  const dirty = on !== enabled || selectedHour !== hour || selectedMinute !== minute
  const timeValue = reminderTimeLabel(selectedHour, selectedMinute)

  const onTimeChange = (value: string) => {
    // Native time input yields "HH:MM"; ignore an empty clear.
    const [h, m] = value.split(':').map(Number)
    if (Number.isFinite(h) && Number.isFinite(m)) {
      setSelectedHour(h as number)
      setSelectedMinute(m as number)
    }
  }

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
      await update({
        reminder_enabled: on,
        reminder_hour: selectedHour,
        reminder_minute: selectedMinute,
      })
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

        <div className="flex flex-col gap-2.5">
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">Time</span>
            <input
              type="time"
              value={timeValue}
              onChange={(event) => onTimeChange(event.target.value)}
              disabled={!on}
              aria-label="Reminder time"
              className="w-full rounded-tile border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Time presets">
            {REMINDER_PRESETS.map((preset) => {
              const active = selectedHour === preset.hour && selectedMinute === preset.minute
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={!on}
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedHour(preset.hour)
                    setSelectedMinute(preset.minute)
                  }}
                  className={cn(
                    'rounded-tile border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    active
                      ? 'border-transparent bg-accent text-on-accent'
                      : 'border-border text-muted hover:text-foreground',
                  )}
                >
                  {preset.label} · {reminderTimeLabel(preset.hour, preset.minute)}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-muted">In your local timezone.</span>
        </div>

        <Button size="lg" onClick={save} disabled={isPending || !dirty}>
          {isPending ? 'Saving…' : 'Save reminder'}
        </Button>
      </div>
    </Sheet>
  )
}
