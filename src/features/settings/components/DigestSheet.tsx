import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { weekdayLabels } from '@/features/settings/lib/digest'
import { requestNotifyPermission } from '@/lib/notify'
import { disablePush, enablePush, pushSupported } from '@/lib/push'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface DigestSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current digest preferences from the profile. */
  enabled: boolean
  day: number
  hour: number
  minute: number
  /**
   * Whether the daily reminder is also on — both features share one device
   * push subscription, so turning the digest off must not unsubscribe a
   * browser the reminder still needs.
   */
  reminderEnabled: boolean
}

/**
 * Weekly digest settings: one push a week summarizing the last 7 days. Unlike
 * the daily reminder, this has no native-local fallback — the content is
 * computed server-side, so every platform (including Capacitor/Tauri) needs
 * an actual Web Push subscription to receive it at all.
 */
export function DigestSheet({
  open,
  onOpenChange,
  enabled,
  day,
  hour,
  minute,
  reminderEnabled,
}: DigestSheetProps) {
  const { t, locale } = useT()
  const { update, isPending } = useUpdateProfile()
  const { user } = useSession()
  const [on, setOn] = useState(enabled)
  const [selectedDay, setSelectedDay] = useState(day)
  const [selectedHour, setSelectedHour] = useState(hour)
  const [selectedMinute, setSelectedMinute] = useState(minute)

  const dirty =
    on !== enabled || selectedDay !== day || selectedHour !== hour || selectedMinute !== minute
  const timeValue = reminderTimeLabel(selectedHour, selectedMinute)
  const days = weekdayLabels(locale)

  const onTimeChange = (value: string) => {
    const [h, m] = value.split(':').map(Number)
    if (Number.isFinite(h) && Number.isFinite(m)) {
      setSelectedHour(h as number)
      setSelectedMinute(m as number)
    }
  }

  const save = async () => {
    try {
      if (on) {
        const granted = await requestNotifyPermission()
        if (!granted) toast.error(t('settings.digestPermissionDenied'))
        if (pushSupported() && user) {
          try {
            await enablePush(user.id)
          } catch {
            toast.error(t('settings.digestSubscribeFailed'))
          }
        }
      } else if (!reminderEnabled && pushSupported()) {
        await disablePush().catch(() => undefined)
      }
      await update({
        digest_enabled: on,
        digest_day: selectedDay,
        digest_hour: selectedHour,
        digest_minute: selectedMinute,
      })
      toast.success(on ? t('settings.digestOn') : t('settings.digestOff'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.digestSaveFailed'))
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.digestTitle')}
      description={t('settings.digestDescription')}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t('settings.digestToggleLabel')}</p>
            <p className="text-xs text-muted">{t('settings.digestToggleHint')}</p>
          </div>
          <Switch checked={on} onCheckedChange={setOn} aria-label={t('settings.digestTitle')} />
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="label-mono">{t('settings.digestDay')}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.digestDay')}>
            {days.map((label, index) => (
              <button
                key={label}
                type="button"
                disabled={!on}
                aria-pressed={selectedDay === index}
                onClick={() => setSelectedDay(index)}
                className={cn(
                  'rounded-tile border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  selectedDay === index
                    ? 'border-transparent bg-accent-solid text-on-accent-solid'
                    : 'border-border text-muted hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="label-mono">{t('settings.digestTime')}</span>
          <input
            type="time"
            value={timeValue}
            onChange={(event) => onTimeChange(event.target.value)}
            disabled={!on}
            aria-label={t('settings.digestTime')}
            className="w-full rounded-tile border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          />
          <span className="text-xs text-muted">{t('settings.digestTimezoneHint')}</span>
        </label>

        <Button size="lg" onClick={save} disabled={isPending || !dirty}>
          {isPending ? t('settings.digestSaving') : t('settings.digestSaveButton')}
        </Button>
      </div>
    </Sheet>
  )
}
