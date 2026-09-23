import { Toaster } from 'sonner'
import { useT } from '@/hooks/useT'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'

const dot = (tone: string) => (
  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />
)

/**
 * The app's toasts: one glass capsule above the tab bar, as in the redesign
 * prototype (`.p-toast`). A coloured dot carries the status — accent for
 * news, teal for done, danger for a failure — and an Undo toast shows a thin
 * countdown under its text (globals.css), so the 5 s window is visible.
 *
 * Placement is CSS, not a media query in JS: the phone and tablet shells keep
 * the toast clear of the bottom nav, desktop sits it at the bottom centre, and
 * both lift it over the sync capsule when that is on screen (`.toaster-lifted`).
 *
 * Every `toast.*` call site is untouched by this.
 */
export function AppToaster() {
  const { t } = useT()
  const theme = useThemeStore((s) => s.resolved)
  const capsule = useUiStore((s) => s.syncCapsuleVisible)

  return (
    <Toaster
      theme={theme === 'coffee' ? 'light' : 'dark'}
      position="bottom-center"
      className={capsule ? 'toaster-lifted' : undefined}
      containerAriaLabel={t('common.notifications')}
      gap={6}
      icons={{
        success: dot('bg-teal'),
        info: dot('bg-accent'),
        warning: dot('bg-warning'),
        error: dot('bg-danger'),
        loading: dot('bg-accent motion-safe:animate-pulse'),
      }}
      toastOptions={{
        unstyled: true,
        duration: 2800,
        classNames: {
          toast: 'toast-capsule lg motion-safe:animate-capsule-in',
          icon: 'flex shrink-0 items-center',
          content: 'min-w-0',
          title: 'truncate',
          description: 'truncate text-footnote font-normal text-muted',
          actionButton:
            'shrink-0 rounded-pill bg-accent/20 px-3 py-1.5 text-callout font-semibold text-accent transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        },
      }}
    />
  )
}
