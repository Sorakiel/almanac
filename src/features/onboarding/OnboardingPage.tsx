import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell, PenLine, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

const STEP_COUNT = 3

interface Feature {
  icon: LucideIcon
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    icon: CheckCircle2,
    title: 'Habits',
    body: 'One-tap daily logging with streaks that forgive the occasional miss.',
  },
  {
    icon: Dumbbell,
    title: 'Training',
    body: 'Plan workouts, track sets, and see your week take shape.',
  },
  {
    icon: PenLine,
    title: 'Reflect',
    body: 'A daily line and a rotating quote to keep your why in view.',
  },
]

/** First-run welcome flow (spec board 02) — three steps, one clear next action. */
function OnboardingPage() {
  const navigate = useNavigate()
  const dismiss = useOnboardingStore((s) => s.dismiss)
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const { update } = useUpdateProfile()
  const [step, setStep] = useState(0)

  // Persist completion on the profile (survives new devices / re-login). The
  // local flag flips first so the shell renders instantly; the DB write runs in
  // the background and a failure only degrades cross-device sync, never blocks.
  const finish = (dest: string, openForm = false) => {
    dismiss()
    void update({ onboarded: true }).catch((error) => {
      console.debug('[onboarding] could not persist completion', error)
    })
    navigate(dest)
    if (openForm) openNewHabit()
  }

  const next = () => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))
  const isLast = step === STEP_COUNT - 1

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
        {step === 1 ? <FeaturesStep /> : null}
        {step === 2 ? <ReadyStep /> : null}

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
              <Button size="lg" onClick={() => finish('/habits', true)} className="shadow-glow">
                <Plus className="h-4 w-4" />
                Create your first habit
              </Button>
              <Button size="lg" variant="ghost" className="border" onClick={() => finish('/')}>
                I&apos;ll explore first
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={next} className="shadow-glow">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="border" onClick={() => finish('/')}>
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

function FeaturesStep() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">// what you track</p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">One place for the whole day</p>
      <div className="mt-8 flex flex-col gap-3 text-left">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-card border bg-surface/60 px-5 py-4"
          >
            <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-tile bg-accent/15 text-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-muted-strong">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function ReadyStep() {
  return (
    <>
      <span className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-accent to-accent-deep shadow-glow">
        <Plus className="h-7 w-7 text-bg" aria-hidden="true" />
      </span>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-accent">// you&apos;re set</p>
      <p className="mt-2.5 text-3xl font-semibold tracking-title">Start with a single habit</p>
      <div className="mt-6 rounded-card border border-dashed border-accent/40 bg-accent/[0.05] px-6 py-6">
        <p className="text-2xl text-accent" aria-hidden="true">
          ◇
        </p>
        <p className="mt-2 font-semibold">Nothing here yet</p>
        <p className="mt-1 text-sm text-muted-strong">
          Everything you track starts with one small daily action. Let&apos;s create your first.
        </p>
      </div>
    </>
  )
}

export default OnboardingPage
