/**
 * Haptic feedback — a thin, platform-safe wrapper.
 *
 * Call sites go in NOW (completion toggles, milestones) so the whole app is
 * wired for feel; the actual buzz lights up in the release phase once
 * `@capacitor/haptics` is bundled and the native shell ships. Until then every
 * call is a no-op on web and desktop (Tauri) — no plugin, no error.
 */

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'success'

// Phase 10 swaps this for the real Capacitor call. Kept as a single seam so
// nothing else in the app needs to know how haptics are delivered.
export function haptic(_strength: HapticStrength = 'light'): void {
  // no-op until the native plugin is added
}
