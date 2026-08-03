import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.tsx'
import { router } from '@/app/router'
import { initAnalytics, trackError, trackPageView } from '@/lib/analytics'
import { initPointerTracking } from '@/lib/viewTransition'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@/styles/globals.css'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
