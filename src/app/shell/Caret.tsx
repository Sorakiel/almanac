import { cn } from '@/lib/utils'

/**
 * A blinking block caret — the little terminal cursor. Decorative only.
 * Under `prefers-reduced-motion` it stays solid instead of blinking.
 */
export function Caret({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'ml-0.5 inline-block h-[0.9em] w-[0.5ch] translate-y-[0.06em] bg-accent motion-safe:animate-caret-blink',
        className,
      )}
    />
  )
}
