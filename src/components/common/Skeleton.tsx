import { cn } from '@/lib/utils'

/**
 * Shimmering placeholder block. A muted surface with a light sweep passing
 * across it — reads as "content loading" far better than a bare spinner.
 * The sweep is disabled under `prefers-reduced-motion` (static block remains).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-tile bg-surface', className)}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent motion-safe:animate-shimmer" />
    </div>
  )
}
