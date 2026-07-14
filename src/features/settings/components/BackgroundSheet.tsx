import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { applyRunInBackground } from '@/lib/desktop'
import { useDesktopStore } from '@/stores/desktop'

interface BackgroundSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Desktop-only setting: keep Almanac running in the tray after the window closes
 * so daily reminders can still fire. A single instant toggle — turning it off is
 * the destructive-to-notifications choice, so we spell that out inline.
 */
export function BackgroundSheet({ open, onOpenChange }: BackgroundSheetProps) {
  const runInBackground = useDesktopStore((s) => s.runInBackground)
  const setRunInBackground = useDesktopStore((s) => s.setRunInBackground)

  const toggle = async (next: boolean) => {
    setRunInBackground(next)
    await applyRunInBackground(next)
    if (next) toast.success('Almanac will keep running in the tray')
    else toast('Reminders won’t fire while the window is closed')
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Run in background"
      description="Keep Almanac in the tray so reminders fire even when the window is closed."
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Stay in the tray</p>
            <p className="text-xs text-muted">Also launches Almanac at login.</p>
          </div>
          <Switch
            checked={runInBackground}
            onCheckedChange={(v) => void toggle(v)}
            aria-label="Keep Almanac running in the background"
          />
        </div>

        {!runInBackground ? (
          <div className="flex gap-3 rounded-tile border border-amber/30 bg-amber/10 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
            <p className="text-xs text-muted">
              With this off, closing the window quits Almanac completely — daily reminders can’t
              reach you until you reopen it. Leave it on if you rely on notifications.
            </p>
          </div>
        ) : null}
      </div>
    </Sheet>
  )
}
