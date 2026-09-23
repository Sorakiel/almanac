import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Rail } from '@/components/rail/Rail'
import { fetchQuotes, type Quote } from '@/features/dashboard/api/quotes.api'
import { localizeQuotes } from '@/features/dashboard/lib/quotes'
import { ReflectTicker } from '@/features/reflect/components/ReflectTicker'
import { ReflectTimeline } from '@/features/reflect/components/ReflectTimeline'
import { ReflectWorkspace } from '@/features/reflect/components/desktop/ReflectWorkspace'
import { ReflectRail } from '@/features/reflect/components/desktop/ReflectRail'
import { useReflections } from '@/features/reflect/hooks/useReflections'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/hooks/useT'

function ReflectPage() {
  const { t, locale } = useT()
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
    () => new Map<string, Quote>(localizeQuotes(quotes ?? [], locale).map((q) => [q.id, q])),
    [quotes, locale],
  )

  const today = useMemo(
    () => reflections.find((r) => r.date === dateKey) ?? null,
    [reflections, dateKey],
  )
  const past = useMemo(() => reflections.filter((r) => r.date !== dateKey), [reflections, dateKey])

  if (isLoading) {
    return <LoadingState label={t('reflect.loading')} />
  }

  if (isError) {
    return <ErrorState title={t('reflect.loadFailed')} onRetry={refetch} />
  }

  if (isDesktop) {
    return (
      <>
        <ReflectWorkspace dateKey={dateKey} today={today} />
        <Rail>
          <ReflectRail reflections={reflections} past={past} dateKey={dateKey} />
        </Rail>
      </>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="label-mono">// {t('reflect.eyebrow')}</p>
        <h1 className="mt-1 text-2xl">{t('reflect.title')}</h1>
      </header>

      <ReflectTicker reflections={reflections} dateKey={dateKey} />

      <ReflectTimeline dateKey={dateKey} today={today} past={past} quoteById={quoteById} />
    </section>
  )
}

export default ReflectPage
