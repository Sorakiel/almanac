import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { browserTimezone, listTimezones, timezoneOffsetLabel } from '@/lib/date'
import { useT } from '@/hooks/useT'

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
  const { t } = useT()
  const { update, isPending } = useUpdateProfile()
  const [selected, setSelected] = useState(current)
  const zones = useMemo(() => listTimezones(), [])
  const device = browserTimezone()

  const save = async () => {
    try {
      await update({ timezone: selected })
      toast.success(t('settings.timezoneUpdated'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.timezoneUpdateFailed'))
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.timezoneTitle')}
      description={t('settings.timezoneDescription')}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.timezoneZone')}</span>
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
          {t('settings.timezoneUseDevice', { device: device.replace(/_/g, ' ') })}
        </button>

        <Button size="lg" onClick={save} disabled={isPending || selected === current}>
          {isPending ? t('settings.timezoneSaving') : t('settings.timezoneSaveButton')}
        </Button>
      </div>
    </Sheet>
  )
}
