import { Toaster } from 'sonner'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useThemeStore } from '@/stores/theme'

/**
 * The app's toasts, in the app's voice.
 *
 * Sonner's `richColors` painted every success a stock green and every error a
 * stock red — the only two saturated colours in the product that came from
 * somewhere other than the token layer, dropped on top of a warm palette. This
 * is fully unstyled instead: surface card, mono type, and a single coloured
 * left rule carrying the status, using the same teal/danger/accent the rest of
 * the app uses. The glyphs are the terminal's, not a stock icon set.
 *
 * Position is the other half. `top-center` sat over the page header on a
 * phone — exactly where the title and the date are — so mobile drops it to the
 * bottom, offset clear of the nav bar. Desktop has nothing at the top to hide
 * and keeps it there.
 *
 * Every one of the ~116 `toast.*` call sites is untouched by this.
 */
export function AppToaster() {
  const theme = useThemeStore((s) => s.theme)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <Toaster
      theme={theme === 'coffee' ? 'light' : 'dark'}
      position={isDesktop ? 'top-center' : 'bottom-center'}
      // Clear of the glass bottom nav (and its safe-area padding) on a phone.
      // `mobileOffset` is separate in sonner 2 and wins under its own
      // breakpoint, so setting only `offset` left the toast under the nav.
      offset={isDesktop ? 16 : 104}
      mobileOffset={{ bottom: 104, left: 16, right: 16 }}
      icons={{
        success: (
          <span aria-hidden="true" className="font-mono text-[13px] font-bold text-teal">
            ✓
          </span>
        ),
        error: (
          <span aria-hidden="true" className="font-mono text-[13px] font-bold text-danger">
            !
          </span>
        ),
        loading: (
          <span aria-hidden="true" className="font-mono text-[13px] font-bold text-accent">
            ◇
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        duration: 2800,
        classNames: {
          // No default left-border colour here on purpose: a base colour and a
          // per-type one are the same utility at the same specificity, so which
          // wins would depend on stylesheet order rather than intent.
          toast:
            'flex w-full items-start gap-2.5 rounded-card border border-l-2 bg-surface/95 px-4 py-3 shadow-card backdrop-blur-nav',
          title: 'font-mono text-[12.5px] leading-snug text-foreground',
          description: 'mt-0.5 font-sans text-[12px] leading-snug text-muted',
          success: 'border-l-teal',
          error: 'border-l-danger',
          loading: 'border-l-accent',
        },
      }}
    />
  )
}
