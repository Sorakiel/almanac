import { toast } from 'sonner'
import type { TFunction } from '@/hooks/useT'
import { isCapacitor, isTauri, requestNotifyPermission } from '@/lib/platform/notify'
import { enablePush, pushSupported } from '@/lib/platform/push'

/**
 * Make this device able to show a habit reminder: ask for notification
 * permission, and on the web subscribe to push — the server is what sends it
 * there. The native shells schedule locally and need only the permission.
 * Failures say so in a toast; the reminder itself stays saved either way.
 */
export async function ensureReminderDelivery(userId: string, t: TFunction): Promise<void> {
  const granted = await requestNotifyPermission()
  if (!granted) {
    toast.error(t('settings.reminderPermissionDenied'))
    return
  }
  if (isTauri() || isCapacitor() || !pushSupported()) return
  try {
    await enablePush(userId)
  } catch {
    toast.error(t('settings.reminderSubscribeFailed'))
  }
}
