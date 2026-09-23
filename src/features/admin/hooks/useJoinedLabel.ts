import { joinedLabel } from '@/features/admin/lib/format'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'

/** `joinedLabel` bound to the interface language. */
export function useJoinedLabel(): (createdAtIso: string, todayKey: string) => string {
  const { t, locale } = useT()
  return (createdAtIso, todayKey) => joinedLabel(createdAtIso, todayKey, t, intlLocale(locale))
}
