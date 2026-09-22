import { Capacitor } from '@capacitor/core'
import { useUpdateStore } from '@/stores/update'

// Self-hosted OTA update for the Android (Capacitor) build. The web layer is
// where ~all our changes live, so we ship a new web bundle over the air instead
// of a fresh APK. The manifest + bundle zip are published to GitHub Releases by
// the desktop-release workflow's `ota` job. No-op off Android (web/desktop).
const MANIFEST_URL =
  'https://github.com/Sorakiel/almanac/releases/latest/download/android-latest.json'

interface UpdateManifest {
  version: string
  url: string
  /** Min native APK version required to run this bundle (set when a release
   *  ships native changes the OTA layer can't deliver). */
  minNative?: string
  /** Direct APK URL for the "please reinstall" prompt. */
  apk?: string
}

export async function checkForAndroidUpdate(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
    const { App } = await import('@capacitor/app')

    // Mark the running bundle as good so Capgo doesn't auto-roll-back to builtin.
    await CapacitorUpdater.notifyAppReady()

    const res = await fetch(MANIFEST_URL, { cache: 'no-store' })
    if (!res.ok) return
    const manifest = (await res.json()) as UpdateManifest

    // Compare against the active OTA bundle if present, else the baked-in APK
    // version, so we don't re-download a bundle we already run.
    const current = await CapacitorUpdater.current()
    const nativeVersion = (await App.getInfo()).version
    const activeVersion =
      current.bundle.version && current.bundle.version !== 'builtin'
        ? current.bundle.version
        : nativeVersion

    if (!isNewer(manifest.version, activeVersion)) return

    // The latest bundle needs native code newer than the installed APK — an OTA
    // web push can't deliver that. Prompt a reinstall instead of shipping a
    // bundle that would crash against the old shell.
    if (manifest.minNative && manifest.apk && isNewer(manifest.minNative, nativeVersion)) {
      useUpdateStore.getState().setReinstall({ version: manifest.version, apkUrl: manifest.apk })
      return
    }

    const bundle = await CapacitorUpdater.download({
      url: manifest.url,
      version: manifest.version,
    })
    // Apply on next background/relaunch — no disruptive mid-session reload.
    await CapacitorUpdater.next({ id: bundle.id })
  } catch (err) {
    // Non-fatal: offline, no release published, or a bad bundle. Never block boot.
    console.debug('[android-updater] check failed', err)
  }
}

// Minimal semver-ish compare: is `a` strictly newer than `b`?
function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}
