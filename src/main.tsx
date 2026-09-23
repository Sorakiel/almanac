import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.tsx'
import { router } from '@/app/router'
import { loadLocale } from '@/i18n'
import { initAnalytics, trackError, trackPageView } from '@/lib/analytics'
import { registerServiceWorker } from '@/lib/platform/serviceWorker'
import { initPointerTracking } from '@/lib/viewTransition'
import { useLocaleStore } from '@/stores/locale'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@/styles/globals.css'

// Cache the app shell so a cold start works with no network. No-op in dev and
// in the native shells, which serve their own copy of these files.
registerServiceWorker()

// Track pointer position so the theme wipe can radiate from where you tapped.
initPointerTracking()

// Analytics starts before render so the first screen is counted. It no-ops
// unless a key is configured and the user hasn't opted out.
initAnalytics()
trackPageView(window.location.pathname)
router.subscribe((state) => trackPageView(state.location.pathname))

// Crashes that never reach a React boundary — async throws, listener errors.
window.addEventListener('error', (e) => trackError(e.error ?? e.message, 'window.onerror'))
window.addEventListener('unhandledrejection', (e) => trackError(e.reason, 'unhandledrejection'))

// The stored language's dictionary is a lazy chunk; render once it is here so
// the first frame after the static skeleton is already in the right language.
// A load failure renders anyway — English fills any gap.
void loadLocale(useLocaleStore.getState().locale)
  .catch(() => undefined)
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
