import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { ChoiceChip } from '@/components/common/ChoiceChip'
import { SwitchRow } from '@/components/common/SwitchRow'
import { TimeField } from '@/features/settings/components/TimeField'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import {
  REMINDER_PRESETS,
  reminderPresetLabel,
  reminderTimeLabel,
} from '@/features/settings/lib/reminder'
import {
  clearScheduledReminders,
  isCapacitor,
  isTauri,
  requestNotifyPermission,
} from '@/lib/notify'
import { disablePush, enablePush, pushSupported } from '@/lib/push'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'

interface ReminderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current reminder preferences from the profile. */
  enabled: boolean
  hour: number
  minute: number
  /**
   * Whether the weekly digest is also on — it shares this same device push
   * subscription, so turning the reminder off must not unsubscribe a browser
   * the digest still needs.
   */
  digestEnabled: boolean
}

/**
 * Daily reminder settings. Almanac sends a device notification at this LOCAL
 * time on days you still have habits left to complete. On mobile the OS delivers
 * it even when the app is closed; on desktop it fires while the app is running.
 */
export function ReminderSheet({
  open,
  onOpenChange,
  enabled,
  hour,
  minute,
  digestEnabled,
}: ReminderSheetProps) {
  const { t } = useT()
  const { update, isPending } = useUpdateProfile()
  const { user } = useSession()
  const [on, setOn] = useState(enabled)
  const [selectedHour, setSelectedHour] = useState(hour)
  const [selectedMinute, setSelectedMinute] = useState(minute)

  const dirty = on !== enabled || selectedHour !== hour || selectedMinute !== minute
  const setTime = (h: number, m: number) => {
    setSelectedHour(h)
    setSelectedMinute(m)
  }

  const save = async () => {
    try {
      // Enabling needs OS permission; if it's refused, save anyway and let the
      // user grant it later from system settings rather than blocking the toggle.
      if (on) {
        const granted = await requestNotifyPermission()
        if (!granted) {
          toast.error(t('settings.reminderPermissionDenied'))
        }
        // On the web the server can only reach this device through a Web Push
        // subscription — the native shell schedules its own local notification
        // instead, so it needs neither.
        if (!isTauri() && !isCapacitor() && pushSupported() && user) {
          try {
            await enablePush(user.id)
          } catch {
            toast.error(t('settings.reminderSubscribeFailed'))
          }
        }
      } else {
        await clearScheduledReminders()
        if (!digestEnabled && !isTauri() && !isCapacitor() && pushSupported())
          await disablePush().catch(() => undefined)
      }
      await update({
        reminder_enabled: on,
        reminder_hour: selectedHour,
        reminder_minute: selectedMinute,
      })
      toast.success(on ? t('settings.reminderOn') : t('settings.reminderOff'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.reminderSaveFailed'))
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.reminderTitle')}
      description={t('settings.reminderDescription')}
    >
      <div className="flex flex-col gap-5">
        <SwitchRow
          title={t('settings.reminderToggleLabel')}
          hint={t('settings.reminderToggleHint')}
          checked={on}
          onCheckedChange={setOn}
          aria-label={t('settings.reminderTitle')}
        />

        <div className="flex flex-col gap-2.5">
          <TimeField
            label={t('settings.reminderTime')}
            hour={selectedHour}
            minute={selectedMinute}
            onChange={setTime}
            disabled={!on}
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('settings.reminderTime')}
          >
            {REMINDER_PRESETS.map((preset) => {
              const active = selectedHour === preset.hour && selectedMinute === preset.minute
              return (
                <ChoiceChip
                  key={preset.key}
                  active={active}
                  disabled={!on}
                  onClick={() => setTime(preset.hour, preset.minute)}
                >
                  {reminderPresetLabel(preset, t)} · {reminderTimeLabel(preset.hour, preset.minute)}
                </ChoiceChip>
              )
            })}
          </div>
          <span className="text-xs text-muted">{t('settings.reminderTimezoneHint')}</span>
        </div>

        <Button size="lg" onClick={save} disabled={isPending || !dirty}>
          {isPending ? t('settings.reminderSaving') : t('settings.reminderSaveButton')}
        </Button>
      </div>
    </Sheet>
  )
}
