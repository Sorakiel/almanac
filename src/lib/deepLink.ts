import { Capacitor } from '@capacitor/core'
import { router } from '@/app/router'
import { supabase } from '@/lib/supabase'

// Auth emails (magic link, signup confirm, password reset) must land back in
// the installed app on Android instead of opening a browser tab. Supabase
// redirects the click to this custom-scheme URL, which the OS hands straight
// to us via the intent-filter in AndroidManifest.xml — see appUrlOpen below.
const NATIVE_AUTH_CALLBACK = 'com.almanac.app://login-callback'

/** Where auth emails should redirect to: the native callback on Android, the site origin on web. */
export function authRedirectTo(path = '/'): string {
  return Capacitor.isNativePlatform() ? NATIVE_AUTH_CALLBACK : `${window.location.origin}${path}`
}

/**
 * Intercepts the native auth callback URL and hands its tokens to
 * supabase-js. No-op on web — supabase-js's own `detectSessionInUrl` handles
 * that case by reading `window.location` on a real page load, but a
 * Capacitor deep link never navigates the WebView, so there's no URL for it
 * to observe; we parse the fragment ourselves and call `setSession`.
 */
export async function initDeepLinks(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const { App } = await import('@capacitor/app')
  await App.addListener('appUrlOpen', ({ url }) => {
    if (!url.startsWith(NATIVE_AUTH_CALLBACK)) return

    const fragment = url.split('#')[1]
    if (!fragment) return
    const params = new URLSearchParams(fragment)

    const errorDescription = params.get('error_description')
    if (errorDescription) {
      router.navigate('/auth')
      return
    }

    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return

    const isRecovery = params.get('type') === 'recovery'
    void supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) return
      router.navigate(isRecovery ? '/auth/reset' : '/', { replace: true })
    })
  })
}
