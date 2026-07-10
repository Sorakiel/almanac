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
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { Switch } from '@/components/ui/switch'
import { SuggestModuleSheet } from '@/features/modules/components/SuggestModuleSheet'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useModulesStore, type ModuleKey } from '@/stores/modules'

interface ToggleModule {
  key: ModuleKey
  title: string
  sub: string
  icon: LucideIcon
  tone: string
  to: string
}

interface SoonModule {
  key: string
  title: string
  icon: LucideIcon
  tone: string
}

function ModulesPage() {
  const navigate = useNavigate()
  const { habits } = useHabits()
  const enabled = useModulesStore((s) => s.enabled)
  const toggle = useModulesStore((s) => s.toggle)
  const [suggestOpen, setSuggestOpen] = useState(false)

  const modules: ToggleModule[] = [
    { key: 'habits', title: 'Habits', sub: `${habits.length} active`, icon: ListChecks, tone: 'bg-accent/15 text-accent', to: '/habits' },
    { key: 'flow', title: 'Flow', sub: 'Deep work', icon: Timer, tone: 'bg-amber/15 text-amber', to: '/flow' },
    { key: 'workouts', title: 'Workouts', sub: 'Train', icon: Dumbbell, tone: 'bg-teal/15 text-teal', to: '/train' },
    { key: 'reflect', title: 'Reflect', sub: 'Journal', icon: NotebookPen, tone: 'bg-accent/15 text-accent', to: '/reflect' },
  ]

  const soon: SoonModule[] = [
    { key: 'finances', title: 'Finances', icon: CircleDollarSign, tone: 'bg-border/10 text-muted' },
    { key: 'reading', title: 'Reading', icon: BookOpen, tone: 'bg-border/10 text-muted' },
    { key: 'goals', title: 'Goals', icon: Target, tone: 'bg-border/10 text-muted' },
    { key: 'sleep', title: 'Sleep', icon: Moon, tone: 'bg-border/10 text-muted' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="label-mono">// your command center</p>
        <h1 className="mt-1 text-2xl">Modules</h1>
      </header>

      <section className="flex flex-col gap-3">
        <SectionLabel accessory="tap to open">ACTIVE</SectionLabel>
        <p className="label-mono normal-case tracking-normal text-muted">
          Toggle a module to show it in the bottom bar.
        </p>
        <div className="flex flex-col gap-2">
          {modules.map((m) => (
            <div key={m.key} className="flex items-center gap-3 rounded-card border bg-surface p-3">
              <button
                type="button"
                onClick={() => navigate(m.to)}
                className="flex flex-1 items-center gap-3 rounded-tile text-left"
              >
                <IconTile icon={m.icon} tone={m.tone} size="sm" />
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-muted">{m.sub}</p>
                </div>
              </button>
              <Switch
                checked={enabled[m.key]}
                onCheckedChange={() => toggle(m.key)}
                aria-label={`Show ${m.title} in navigation`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 rounded-card border bg-surface p-3 text-left transition-colors hover:border-accent/40"
          >
            <IconTile icon={Settings} tone="bg-border/10 text-muted" size="sm" />
            <div>
              <p className="font-semibold">Settings</p>
              <p className="text-sm text-muted">Profile &amp; appearance</p>
            </div>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>COMING SOON</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {soon.map((m) => (
            <div key={m.key} className="flex items-center gap-3 rounded-card border bg-surface/50 p-4">
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
