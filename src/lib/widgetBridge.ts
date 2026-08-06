import { registerPlugin } from '@capacitor/core'
import { isCapacitor } from '@/lib/notify'

interface WidgetBridgePlugin {
  updateToday(options: { done: number; total: number; pending: string[] }): Promise<void>
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge')

/**
 * Push today's habit summary to the Android home-screen widget (see
 * `WidgetBridgePlugin.kt` — it writes SharedPreferences and redraws every
 * instance of `TodayWidgetProvider`). No-op off Android; failures are
 * swallowed to a debug log — a sync miss must never surface to the user.
 */
export async function updateAndroidWidget(
  done: number,
  total: number,
  pending: string[],
): Promise<void> {
  if (!isCapacitor()) return
  try {
    await WidgetBridge.updateToday({ done, total, pending })
  } catch (err) {
    console.debug('[widget] updateToday failed', err)
  }
}
