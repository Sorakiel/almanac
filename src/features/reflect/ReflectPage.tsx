import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Rail } from '@/components/common/desktop/rail'
import { fetchQuotes, type Quote } from '@/features/dashboard/api/quotes.api'
import { ReflectTimeline } from '@/features/reflect/components/ReflectTimeline'
import { ReflectWorkspace } from '@/features/reflect/components/desktop/ReflectWorkspace'
import { ReflectRail } from '@/features/reflect/components/desktop/ReflectRail'
import { useReflections } from '@/features/reflect/hooks/useReflections'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToday } from '@/hooks/useToday'

function ReflectPage() {
  const { reflections, isLoading, isError, refetch } = useReflections()
  const { dateKey } = useToday()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Quotes are a tiny cached global; map them so each entry shows its pairing.
  const { data: quotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
    staleTime: 1000 * 60 * 60,
  })
  const quoteById = useMemo(
    () => new Map<string, Quote>((quotes ?? []).map((q) => [q.id, q])),
    [quotes],
  )

  const today = useMemo(
    () => reflections.find((r) => r.date === dateKey) ?? null,
    [reflections, dateKey],
  )
  const past = useMemo(() => reflections.filter((r) => r.date !== dateKey), [reflections, dateKey])

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading your journal…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Couldn't load your journal"
        description="Something went wrong reaching the server."
        action={
          <Button size="sm" variant="surface" onClick={refetch}>
            Try again
          </Button>
        }
      />
    )
  }

  if (isDesktop) {
    return (
      <>
        <ReflectWorkspace dateKey={dateKey} today={today} past={past} quoteById={quoteById} />
        <Rail>
          <ReflectRail reflections={reflections} dateKey={dateKey} />
        </Rail>
      </>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="label-mono">// daily journal</p>
        <h1 className="mt-1 text-2xl">Reflect</h1>
      </header>

      <ReflectTimeline dateKey={dateKey} today={today} past={past} quoteById={quoteById} />
    </section>
  )
}

export default ReflectPage
