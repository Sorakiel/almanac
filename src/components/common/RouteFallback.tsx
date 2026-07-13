import { Loader2 } from 'lucide-react'

/** Suspense fallback for lazily-loaded route chunks. */
export function RouteFallback() {
  return (
    <div className="flex justify-center py-24" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
