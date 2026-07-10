import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CircleDollarSign,
  Dumbbell,
  ListChecks,
  Moon,
  NotebookPen,
  Plus,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { SuggestModuleSheet } from '@/features/modules/components/SuggestModuleSheet'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { cn } from '@/lib/utils'

interface ModuleDef {
  key: string
  title: string
  sub: string
  icon: LucideIcon
  tone: string
  to?: string
}

function ModulesPage() {
  const navigate = useNavigate()
  const { habits } = useHabits()
  const [suggestOpen, setSuggestOpen] = useState(false)

  const active: ModuleDef[] = [
    {
      key: 'habits',
      title: 'Habits',
      sub: `${habits.length} active`,
      icon: ListChecks,
      tone: 'bg-accent/15 text-accent',
      to: '/habits',
    },
    { key: 'workouts', title: 'Workouts', sub: 'Train', icon: Dumbbell, tone: 'bg-teal/15 text-teal', to: '/train' },
    { key: 'reflect', title: 'Reflect', sub: 'Journal', icon: NotebookPen, tone: 'bg-accent/15 text-accent', to: '/reflect' },
    { key: 'settings', title: 'Settings', sub: 'Profile', icon: Settings, tone: 'bg-border/10 text-muted', to: '/settings' },
  ]

  const soon: ModuleDef[] = [
    { key: 'finances', title: 'Finances', sub: 'Soon', icon: CircleDollarSign, tone: 'bg-border/10 text-muted' },
    { key: 'reading', title: 'Reading', sub: 'Soon', icon: BookOpen, tone: 'bg-border/10 text-muted' },
    { key: 'goals', title: 'Goals', sub: 'Soon', icon: Target, tone: 'bg-border/10 text-muted' },
    { key: 'sleep', title: 'Sleep', sub: 'Soon', icon: Moon, tone: 'bg-border/10 text-muted' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="label-mono">// your command center</p>
        <h1 className="mt-1 text-2xl">Modules</h1>
      </header>

      <section className="flex flex-col gap-3">
        <SectionLabel>ACTIVE</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {active.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => m.to && navigate(m.to)}
              className="flex flex-col gap-3 rounded-card border bg-surface p-4 text-left transition-colors hover:border-accent/40"
            >
              <IconTile icon={m.icon} tone={m.tone} />
              <div>
                <p className="font-semibold">{m.title}</p>
                <p className="text-sm text-muted">{m.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>COMING SOON</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {soon.map((m) => (
            <div
              key={m.key}
              className={cn('flex items-center gap-3 rounded-card border bg-surface/50 p-4')}
            >
              <IconTile icon={m.icon} tone={m.tone} size="sm" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted">{m.title}</p>
                <Tag tone="muted">Soon</Tag>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => setSuggestOpen(true)}
        className="flex items-center gap-3 rounded-card border border-dashed px-4 py-4 text-left text-sm text-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
        Suggest a module — Almanac grows with you.
      </button>

      <SuggestModuleSheet open={suggestOpen} onOpenChange={setSuggestOpen} />
    </div>
  )
}

export default ModulesPage
