import { Download, X } from 'lucide-react'
import { useUpdateStore } from '@/stores/update'

/**
 * Android-only prompt shown when an update ships native changes the over-the-air
 * layer can't deliver — the user must install a fresh APK. Sits at the top of
 * the shell; dismissible for the session (re-checks on next launch).
 */
export function ReinstallBanner() {
  const reinstall = useUpdateStore((s) => s.reinstall)
  const setReinstall = useUpdateStore((s) => s.setReinstall)
  if (!reinstall) return null

  return (
    <div
      role="status"
      className="flex items-center gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)]"
    >
      <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="font-semibold">Update {reinstall.version} is ready.</span>{' '}
        <span className="text-muted">It needs a fresh install — download the new APK.</span>
      </p>
      <a
        href={reinstall.apkUrl}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-[10px] bg-accent px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-label text-on-accent transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Get APK
      </a>
      <button
        type="button"
        onClick={() => setReinstall(null)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 text-muted-strong transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
