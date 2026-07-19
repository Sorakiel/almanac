import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { useHabitMutations, type HabitFormInput } from '@/features/habits/hooks/useHabitMutations'
import { HABIT_ICONS, type HabitColor, type HabitIcon } from '@/features/habits/lib/habitVisuals'
import { OPTIONAL_MODULES, useModulesStore, type ModuleKey } from '@/stores/modules'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const STEP_COUNT = 4

/** Curated first-run habits — one tap each, created on finish. */
interface HabitTemplate {
  key: string
  name: string
  icon: HabitIcon
  color: HabitColor
  frequency: HabitFormInput['frequency']
  time_of_day: HabitFormInput['time_of_day']
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  { key: 'water', name: 'Drink water', icon: 'droplet', color: 'teal', frequency: 'daily', time_of_day: 'anytime' },
  { key: 'read', name: 'Read', icon: 'book', color: 'amber', frequency: 'daily', time_of_day: 'evening' },
  { key: 'move', name: 'Move my body', icon: 'dumbbell', color: 'accent', frequency: 'weekdays', time_of_day: 'anytime' },
  { key: 'meditate', name: 'Meditate', icon: 'brain', color: 'teal', frequency: 'daily', time_of_day: 'morning' },
  { key: 'sunlight', name: 'Morning sunlight', icon: 'sun', color: 'amber', frequency: 'daily', time_of_day: 'morning' },
  { key: 'sleep', name: 'Sleep by 23:00', icon: 'moon', color: 'muted', frequency: 'daily', time_of_day: 'evening' },
]

/** Two templates pre-checked so the common path is a single tap. */
const DEFAULT_PICKS = ['water', 'read']

function toInput(t: HabitTemplate): HabitFormInput {
  return {
    name: t.name,
    description: null,
    icon: t.icon,
    color: t.color,
    frequency: t.frequency,
    target_count: 1,
    time_of_day: t.time_of_day,
  }
}

/** First-run welcome flow (spec board 02): welcome → modules → habits → ready. */
function OnboardingPage() {
  const navigate = useNavigate()
  const dismiss = useOnboardingStore((s) => s.dismiss)
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const { update } = useUpdateProfile()
  const { create } = useHabitMutations()

  const enabled = useModulesStore((s) => s.enabled)
  const setModule = useModulesStore((s) => s.setModule)

  const [step, setStep] = useState(0)
  const [modules, setModules] = useState<Record<ModuleKey, boolean>>(enabled)
  const [picks, setPicks] = useState<Set<string>>(() => new Set(DEFAULT_PICKS))
  const [saving, setSaving] = useState(false)

  const toggleModule = (key: ModuleKey) => setModules((m) => ({ ...m, [key]: !m[key] }))
  const togglePick = (key: string) =>
    setPicks((p) => {
      const next = new Set(p)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const persistOnboarded = () =>
    void update({ onboarded: true }).catch((error) => {
      console.debug('[onboarding] could not persist completion', error)
    })

  /** Push the local module choices into the store (core modules stay pinned). */
  const applyModules = () => {
    for (const m of OPTIONAL_MODULES) {
      if (modules[m.key] !== enabled[m.key]) setModule(m.key, modules[m.key])
    }
  }

  // Finish from the Ready step: apply modules, optionally create the picked
  // habits, then land on Habits (or the dashboard if nothing was created).
  const complete = async (withHabits: boolean, openForm = false) => {
    if (saving) return
    setSaving(true)
    applyModules()
    const chosen = withHabits ? HABIT_TEMPLATES.filter((t) => picks.has(t.key)) : []
    if (chosen.length > 0) {
      try {
        await Promise.all(chosen.map((t) => create.mutateAsync(toInput(t))))
        toast.success(`${chosen.length} habit${chosen.length > 1 ? 's' : ''} added`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not create habits')
        setSaving(false)
        return
      }
    }
    dismiss()
    persistOnboarded()
    navigate(chosen.length > 0 || openForm ? '/habits' : '/')
    if (openForm) openNewHabit()
  }

  // Bail out early (top "Skip"): keep defaults, create nothing.
  const skip = () => {
    dismiss()
    persistOnboarded()
    navigate('/')
  }

  const next = () => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))
  const isLast = step === STEP_COUNT - 1
  const hasPicks = picks.size > 0

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-6 py-12 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, rgb(var(--color-accent) / 0.16), transparent 52%)',
        }}
      />

      <div className="absolute left-8 top-8 flex items-center gap-2 font-mono text-[11px] tracking-label text-muted-strong">
        <span className="text-accent">◇</span> ALMANAC
      </div>
      <div className="absolute right-8 top-8 font-mono text-[11px] text-muted-strong">
        step {step + 1} of {STEP_COUNT}
      </div>

      <div className="relative w-full max-w-[520px] text-center">
        {step === 0 ? <WelcomeStep /> : null}
        {step === 1 ? <ModulesStep modules={modules} onToggle={toggleModule} /> : null}
        {step === 2 ? <TemplatesStep picks={picks} onToggle={togglePick} /> : null}
        {step === 3 ? <ReadyStep count={picks.size} /> : null}

        <div
          className="mt-8 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Onboarding progress"
        >
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-6 bg-accent' : 'w-1.5 bg-muted-strong/40',
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {isLast ? (
            <>
              <Button
                size="lg"
                disabled={saving}
                onClick={() => complete(hasPicks, !hasPicks)}
                className="shadow-glow"
              >
                {hasPicks ? (
                  <>
                    <Check className="h-4 w-4" />
                    {saving ? 'Setting up…' : `Add ${picks.size} & start`}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create your first habit
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border"
                disabled={saving}
                onClick={() => complete(false)}
              >
                I&apos;ll explore first
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={next} className="shadow-glow">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="border" onClick={skip}>
                Skip
              </Button>
            </>
          )}
        </div>

        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="mx-auto mt-5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-label text-muted-strong transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </button>
        ) : null}
      </div>
    </main>
  )
}

function WelcomeStep() {
  return (
    <>
      <span className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-accent to-accent-deep shadow-glow">
        <span aria-hidden="true" className="h-6 w-6 rotate-45 border-[2.4px] border-bg" />
      </span>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-accent">// welcome to</p>
      <p className="mt-2.5 font-mono text-5xl font-bold tracking-[0.04em] sm:text-[58px]">ALMANAC</p>
      <p className="mx-auto mt-4 max-w-[460px] text-lg leading-relaxed text-muted">
        Your personal command center. Build habits, track training, and hold your own line — one day
        at a time.
      </p>
    </>
  )
}

interface ModulesStepProps {
  modules: Record<ModuleKey, boolean>
  onToggle: (key: ModuleKey) => void
}

/** Step 2: pick which optional modules show in the nav. Core ones are pinned. */
function ModulesStep({ modules, onToggle }: ModulesStepProps) {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">// build your app</p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">Pick your modules</p>
      <p className="mx-auto mt-3 max-w-[420px] text-sm text-muted-strong">
        Habits and Insights are always on. Add whatever else you want — you can change this any time
        under More.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        {OPTIONAL_MODULES.map(({ key, label, icon: Icon }) => {
          const on = modules[key]
          return (
            <SelectTile key={key} on={on} onClick={() => onToggle(key)}>
              <span
                className={cn(
                  'flex h-10 w-10 flex-none items-center justify-center rounded-tile transition-colors',
                  on ? 'bg-accent/15 text-accent' : 'bg-border/10 text-muted-strong',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 font-semibold">{label}</span>
            </SelectTile>
          )
        })}
      </div>
    </>
  )
}

interface TemplatesStepProps {
  picks: Set<string>
  onToggle: (key: string) => void
}

/** Step 3: multi-select starter habits, created on finish. */
function TemplatesStep({ picks, onToggle }: TemplatesStepProps) {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">// start tracking</p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">Add a few habits</p>
      <p className="mx-auto mt-3 max-w-[420px] text-sm text-muted-strong">
        Tap the ones you want. We&apos;ll create them for you — tweak or delete any of them later.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        {HABIT_TEMPLATES.map((t) => {
          const Icon = HABIT_ICONS[t.icon]
          const on = picks.has(t.key)
          return (
            <SelectTile key={t.key} on={on} onClick={() => onToggle(t.key)} compact>
              <span
                className={cn(
                  'flex h-9 w-9 flex-none items-center justify-center rounded-tile transition-colors',
                  on ? 'bg-accent/15 text-accent' : 'bg-border/10 text-muted-strong',
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{t.name}</span>
            </SelectTile>
          )
        })}
      </div>
    </>
  )
}

interface SelectTileProps {
  on: boolean
  onClick: () => void
  compact?: boolean
  children: ReactNode
}

/** Shared multi-select tile: icon + label + a check that fills when selected. */
function SelectTile({ on, onClick, compact, children }: SelectTileProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-card border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        compact ? 'px-4 py-3.5' : 'px-4 py-4',
        on ? 'border-accent/60 bg-accent/[0.07]' : 'border-border bg-surface/60 hover:border-accent/30',
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors',
          on ? 'border-accent bg-accent text-bg' : 'border-muted-strong/50 text-transparent',
        )}
      >
        <Check className="h-3 w-3" />
      </span>
    </button>
  )
}

function ReadyStep({ count }: { count: number }) {
  return (
    <>
      <span className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-accent to-accent-deep shadow-glow">
        {count > 0 ? (
          <Check className="h-8 w-8 text-bg" aria-hidden="true" />
        ) : (
          <Plus className="h-7 w-7 text-bg" aria-hidden="true" />
        )}
      </span>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-accent">
        // you&apos;re set
      </p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">
        {count > 0 ? 'Ready when you are' : 'Start with a single habit'}
      </p>
      <div className="mt-6 rounded-card border border-dashed border-accent/40 bg-accent/[0.05] px-6 py-6">
        <p className="text-2xl text-accent" aria-hidden="true">
          ◇
        </p>
        <p className="mt-2 font-semibold">
          {count > 0 ? `${count} habit${count > 1 ? 's' : ''} ready to add` : 'Nothing here yet'}
        </p>
        <p className="mt-1 text-sm text-muted-strong">
          {count > 0
            ? 'Tap below and they land on your Habits page, ready for their first check-off.'
            : 'Everything you track starts with one small daily action. Let’s create your first.'}
        </p>
      </div>
    </>
  )
}

export default OnboardingPage
