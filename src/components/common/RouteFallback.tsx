import { Skeleton } from '@/components/common/Skeleton'

/** Suspense fallback for lazily-loaded route chunks: a shimmering page shell. */
export function RouteFallback() {
  return (
    <div className="flex flex-col gap-4 py-2" role="status" aria-live="polite">
      <Skeleton className="h-8 w-2/5" />
      <Skeleton className="h-24 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
      <Skeleton className="h-40 w-full rounded-card" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
