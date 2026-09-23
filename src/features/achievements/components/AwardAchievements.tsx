import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { MANUAL_ACHIEVEMENTS } from '@/features/achievements/lib/catalog'
import { useUserGrants } from '@/features/achievements/hooks/useUserGrants'
import type { AchievementTone } from '@/features/achievements/types'
import { useT } from '@/hooks/useT'
import { achievementDescription, achievementTitle } from '@/features/achievements/lib/text'
import { toUserError } from '@/lib/userError'

const TONE: Record<AchievementTone, string> = {
  accent: 'bg-accent/15 text-accent',
  teal: 'bg-teal/15 text-teal',
  amber: 'bg-amber/15 text-amber',
}

/** Owner-only panel to award or revoke manual achievements for a user. */
export function AwardAchievements({ userId, userName }: { userId: string; userName: string }) {
  const { t } = useT()
  const { granted, toggle } = useUserGrants(userId, true)

  const onToggle = (achievementId: string, title: string, on: boolean) =>
    toggle.mutate(
      { achievementId, on },
      {
        onSuccess: () =>
          toast.success(t(on ? 'achievements.awarded' : 'achievements.revoked', { title })),
        onError: (error) => toast.error(toUserError(error, t, 'achievements.awardFailed')),
      },
    )

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={t('achievements.owner')}>{t('achievements.awards')}</SectionLabel>
      <div className="divide-y overflow-hidden rounded-card border bg-surface">
        {MANUAL_ACHIEVEMENTS.map((def) => {
          const on = granted.has(def.id)
          const title = achievementTitle(t, def, def.title)
          return (
            <div key={def.id} className="flex items-center gap-3 px-4 py-3">
              <IconTile icon={def.icon} tone={TONE[def.tone]} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="truncate text-[12px] text-muted">{achievementDescription(t, def)}</p>
              </div>
              <Switch
                checked={on}
                disabled={toggle.isPending}
                onCheckedChange={(next) => onToggle(def.id, title, next)}
                aria-label={t('achievements.awardTo', { title, name: userName })}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
