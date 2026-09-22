import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { SwitchRow } from '@/components/common/SwitchRow'
import { applyRunInBackground } from '@/lib/platform/desktop'
import { useDesktopStore } from '@/stores/desktop'
import { useT } from '@/hooks/useT'

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
  const { t } = useT()
  const runInBackground = useDesktopStore((s) => s.runInBackground)
  const setRunInBackground = useDesktopStore((s) => s.setRunInBackground)

  const toggle = async (next: boolean) => {
    setRunInBackground(next)
    await applyRunInBackground(next)
    if (next) toast.success(t('settings.trayOn'))
    else toast(t('settings.trayOff'))
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.backgroundTitle')}
      description={t('settings.backgroundDescription')}
    >
      <div className="flex flex-col gap-5">
        <SwitchRow
          title={t('settings.trayTitle')}
          hint={t('settings.trayHint')}
          checked={runInBackground}
          onCheckedChange={(v) => void toggle(v)}
          aria-label={t('a11y.keepRunning')}
        />

        {!runInBackground ? (
          <div className="flex gap-3 rounded-tile border border-amber/30 bg-amber/10 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
            <p className="text-xs text-muted">{t('settings.trayWarning')}</p>
          </div>
        ) : null}
      </div>
    </Sheet>
  )
}
