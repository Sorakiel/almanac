import { useT } from '@/hooks/useT'

const ROWS = 5

/**
 * The same outline index.html paints in the first frame (its `.boot*` styles
 * live there, so they apply before any bundle has loaded). Shown while the
 * session and profile resolve, so a cold start is one continuous skeleton
 * instead of the static one, then a spinner, then another.
 */
export function BootSkeleton() {
  const { t } = useT()
  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-side" />
      <div className="boot-main">
        <div className="boot-b boot-eyebrow" />
        <div className="boot-b boot-title" />
        <div className="boot-b boot-card" />
        {Array.from({ length: ROWS }, (_, i) => (
          <div key={i} className="boot-b boot-row" />
        ))}
      </div>
      <div className="boot-rail" />
      <div className="boot-nav" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
