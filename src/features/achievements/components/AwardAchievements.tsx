import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { MANUAL_ACHIEVEMENTS } from '@/features/achievements/lib/catalog'
import { useUserGrants } from '@/features/achievements/hooks/useUserGrants'
import type { AchievementTone } from '@/features/achievements/types'

const TONE: Record<AchievementTone, string> = {
  accent: 'bg-accent/15 text-accent',
  teal: 'bg-teal/15 text-teal',
  amber: 'bg-amber/15 text-amber',
}

/** Owner-only panel to award or revoke manual achievements for a user. */
export function AwardAchievements({ userId, userName }: { userId: string; userName: string }) {
  const { granted, toggle } = useUserGrants(userId, true)

  const onToggle = (achievementId: string, title: string, on: boolean) =>
    toggle.mutate(
      { achievementId, on },
      {
        onSuccess: () => toast.success(on ? `Awarded “${title}”` : `Revoked “${title}”`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update the award'),
      },
    )

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory="owner">AWARDS</SectionLabel>
      <div className="divide-y overflow-hidden rounded-card border bg-surface">
        {MANUAL_ACHIEVEMENTS.map((def) => {
          const on = granted.has(def.id)
          return (
            <div key={def.id} className="flex items-center gap-3 px-4 py-3">
              <IconTile icon={def.icon} tone={TONE[def.tone]} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{def.title}</p>
                <p className="truncate text-[12px] text-muted">{def.description}</p>
              </div>
              <Switch
                checked={on}
                disabled={toggle.isPending}
                onCheckedChange={(next) => onToggle(def.id, def.title, next)}
                aria-label={`Award ${def.title} to ${userName}`}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
