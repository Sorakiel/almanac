import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * First-run welcome gate. The source of truth is `profiles.onboarded` (so it
 * survives across devices and re-logins); this persisted flag is only a
 * device-local fast-path that lets the shell render immediately after the user
 * finishes onboarding, before the profile row round-trips.
 *
 * Scoped to the account that set it: a bare boolean leaked across sign-outs, so
 * the second person to sign up on a shared device skipped the welcome flow
 * entirely — and with it the timezone the flow records.
 */
interface OnboardingState {
  /** Id of the user who completed onboarding on this device, if any. */
  dismissedFor: string | null
  dismiss: (userId: string) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      dismissedFor: null,
      dismiss: (userId: string) => set({ dismissedFor: userId }),
    }),
    {
      name: 'almanac.onboarding',
      version: 1,
      // v0 stored a bare `dismissed` boolean with no idea whose it was, so it
      // can't be mapped onto an account — drop it. Costs nothing: the server's
      // `profiles.onboarded` is the real gate, and it's already true for
      // everyone who has onboarded, so no one re-runs the welcome flow.
      migrate: () => ({ dismissedFor: null }),
    },
  ),
)
