import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { ChoiceChip } from '@/components/common/ChoiceChip'
import { SwitchRow } from '@/components/common/SwitchRow'
import { TimeField } from '@/features/settings/components/TimeField'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { weekdayLabels } from '@/lib/dateLocale'
import { requestNotifyPermission } from '@/lib/platform/notify'
import { disablePush, enablePush, pushSupported } from '@/lib/platform/push'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'

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
  const days = weekdayLabels(locale)

  const setTime = (h: number, m: number) => {
    setSelectedHour(h)
    setSelectedMinute(m)
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
        <SwitchRow
          title={t('settings.digestToggleLabel')}
          hint={t('settings.digestToggleHint')}
          checked={on}
          onCheckedChange={setOn}
          aria-label={t('settings.digestTitle')}
        />

        <div className="flex flex-col gap-2.5">
          <span className="label-mono">{t('settings.digestDay')}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('settings.digestDay')}>
            {days.map((label, index) => (
              <ChoiceChip
                key={label}
                active={selectedDay === index}
                disabled={!on}
                onClick={() => setSelectedDay(index)}
              >
                {label}
              </ChoiceChip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <TimeField
            label={t('settings.digestTime')}
            hour={selectedHour}
            minute={selectedMinute}
            onChange={setTime}
            disabled={!on}
          />
          <span className="text-xs text-muted">{t('settings.digestTimezoneHint')}</span>
        </div>

        <Button size="lg" onClick={save} disabled={isPending || !dirty}>
          {isPending ? t('settings.digestSaving') : t('settings.digestSaveButton')}
        </Button>
      </div>
    </Sheet>
  )
}
