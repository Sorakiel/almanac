import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { browserTimezone, listTimezones, timezoneOffsetLabel } from '@/lib/date'

interface TimezoneSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The profile's current timezone (falls back to the device zone). */
  current: string
}

/**
 * Timezone picker. The saved zone drives the user's "today", so a wrong value
 * silently shifts streak boundaries — we default to the detected device zone.
 */
export function TimezoneSheet({ open, onOpenChange, current }: TimezoneSheetProps) {
  const { update, isPending } = useUpdateProfile()
  const [selected, setSelected] = useState(current)
  const zones = useMemo(() => listTimezones(), [])
  const device = browserTimezone()

  const save = async () => {
    try {
      await update({ timezone: selected })
      toast.success('Timezone updated')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update timezone')
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Timezone"
      description="Almanac uses this to decide when your day starts and ends."
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Zone</span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full rounded-tile border bg-surface px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, ' ')} · {timezoneOffsetLabel(zone)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setSelected(device)}
          className="self-start text-sm text-muted transition-colors hover:text-accent"
        >
          Use device timezone ({device.replace(/_/g, ' ')})
        </button>

        <Button size="lg" onClick={save} disabled={isPending || selected === current}>
          {isPending ? 'Saving…' : 'Save timezone'}
        </Button>
      </div>
    </Sheet>
  )
}
