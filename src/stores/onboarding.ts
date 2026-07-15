import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * First-run welcome gate. The source of truth is `profiles.onboarded` (so it
 * survives across devices and re-logins); this persisted flag is only a
 * device-local fast-path that lets the shell render immediately after the user
 * finishes onboarding, before the profile row round-trips.
 */
interface OnboardingState {
  dismissed: boolean
  dismiss: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist((set) => ({ dismissed: false, dismiss: () => set({ dismissed: true }) }), {
    name: 'almanac.onboarding',
  }),
)
