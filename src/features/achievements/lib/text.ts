import type { TFunction } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'
import type { AchievementDef } from '@/features/achievements/types'

/**
 * The badge's shown name. `displayTitle` is the English tier name (the tier's
 * identity in the catalog), or the badge's own title before any tier — only
 * tier names live under `achievements.tiers`.
 */
export function achievementTitle(t: TFunction, def: AchievementDef, displayTitle: string): string {
  return t(
    (displayTitle === def.title
      ? `achievements.catalog.${def.id}.title`
      : `achievements.tiers.${displayTitle}`) as TranslationKey,
  )
}

export function achievementDescription(t: TFunction, def: AchievementDef): string {
  return t(`achievements.catalog.${def.id}.description` as TranslationKey)
}
