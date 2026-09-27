import { useMemo } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { ReflectWorkspace } from '@/features/reflect/components/ReflectWorkspace'
import { useReflections } from '@/features/reflect/hooks/useReflections'
import { journalStreak } from '@/features/reflect/lib/format'
import { useToday } from '@/hooks/useToday'
import { useT } from '@/hooks/useT'

function ReflectPage() {
  const { t } = useT()
  const { reflections, isLoading, isError, refetch } = useReflections()
  const { dateKey } = useToday()

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

  return (
    <ReflectWorkspace
      dateKey={dateKey}
      today={today}
      past={past}
      reflections={reflections}
      streak={journalStreak(new Set(reflections.map((r) => r.date)), dateKey)}
    />
  )
}

export default ReflectPage
