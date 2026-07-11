import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUiStore } from '@/stores/ui'

/** First-run welcome splash (spec board 02) — one clear next step, no shell. */
function OnboardingPage() {
  const navigate = useNavigate()
  const dismiss = useOnboardingStore((s) => s.dismiss)
  const openNewHabit = useUiStore((s) => s.openNewHabit)

  const createFirst = () => {
    dismiss()
    navigate('/habits')
    openNewHabit()
  }
  const skip = () => {
    dismiss()
    navigate('/')
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-6 py-12 text-foreground">
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
        step 1 of 3
      </div>

      <div className="relative w-full max-w-[520px] text-center">
        <span className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-accent to-accent-deep shadow-glow">
          <span aria-hidden="true" className="h-6 w-6 rotate-45 border-[2.4px] border-bg" />
        </span>

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          // welcome to
        </p>
        <p className="mt-2.5 font-mono text-5xl font-bold tracking-[0.04em] sm:text-[58px]">
          ALMANAC
        </p>
        <p className="mx-auto mt-4 max-w-[460px] text-lg leading-relaxed text-muted">
          Your personal command center. Build habits, track training, and hold your own line — one
          day at a time.
        </p>

        <div className="mt-10 rounded-card border border-dashed border-accent/40 bg-accent/[0.05] px-6 py-6">
          <p className="text-2xl text-accent" aria-hidden="true">
            ◇
          </p>
          <p className="mt-2 font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-strong">
            Everything you track starts with a single habit. Let&apos;s create your first.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-1.5 w-6 rounded-full bg-accent" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-strong/40" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-strong/40" />
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={createFirst} className="shadow-glow">
            <Plus className="h-4 w-4" />
            Create your first habit
          </Button>
          <Button size="lg" variant="ghost" className="border" onClick={skip}>
            Skip for now
          </Button>
        </div>
      </div>
    </main>
  )
}

export default OnboardingPage
