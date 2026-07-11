import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** First-run welcome: shown once until the user creates a habit or skips. */
interface OnboardingState {
  dismissed: boolean
  dismiss: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist((set) => ({ dismissed: false, dismiss: () => set({ dismissed: true }) }), {
    name: 'almanac.onboarding',
  }),
)
