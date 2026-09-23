import { Capacitor } from '@capacitor/core'
import type { Theme } from '@/stores/theme'

/**
 * Match the Android system bars to the app theme. targetSdk 36 forces
 * edge-to-edge, so the WebView already draws behind the status + navigation
 * bars; left alone the bars render the device's (often white) default, which
 * showed as jarring white strips top and bottom over our dark UI.
 *
 * We keep the bars transparent (the themed page background shows through) and
 * only flip the icon/text colour to stay legible: light icons on the dark
 * theme, dark icons on the coffee (light) theme.
 *
 * No-op off Android, and defensively guarded so an OTA web bundle running on an
 * older APK without the native plugin simply does nothing instead of throwing.
 */
export async function applyNativeStatusBar(theme: Theme): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setStyle({ style: theme === 'coffee' ? Style.Light : Style.Dark })
  } catch (err) {
    // Plugin missing (old APK) or unsupported — never block boot or theme swaps.
    console.debug('[status-bar] apply failed', err)
  }
}
