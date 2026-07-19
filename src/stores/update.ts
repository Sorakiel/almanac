import { create } from 'zustand'

export interface ReinstallInfo {
  /** Version that requires a fresh APK. */
  version: string
  /** Direct APK download URL from the GitHub release. */
  apkUrl: string
}

interface UpdateState {
  /** Set when an OTA update needs a native APK reinstall (Android only). */
  reinstall: ReinstallInfo | null
  setReinstall: (info: ReinstallInfo | null) => void
}

/** Cross-cutting update state — currently the Android "please reinstall" prompt. */
export const useUpdateStore = create<UpdateState>((set) => ({
  reinstall: null,
  setReinstall: (reinstall) => set({ reinstall }),
}))
