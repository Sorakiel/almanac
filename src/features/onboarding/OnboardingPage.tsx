import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/features/settings/hooks/useUpdateProfile'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { ModulesStep } from '@/features/onboarding/components/ModulesStep'
import { ReadyStep } from '@/features/onboarding/components/ReadyStep'
import { TemplatesStep } from '@/features/onboarding/components/TemplatesStep'
import { WelcomeStep } from '@/features/onboarding/components/WelcomeStep'
import { DEFAULT_PICKS, HABIT_TEMPLATES, toInput } from '@/features/onboarding/lib/templates'
import { OPTIONAL_MODULES, useModulesStore, type ModuleKey } from '@/stores/modules'
import { useOnboardingStore } from '@/stores/onboarding'
import { useUiStore } from '@/stores/ui'
import { useSession } from '@/hooks/useSession'
import { browserTimezone } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

const STEP_COUNT = 4

/** First-run welcome flow (spec board 02): welcome → modules → habits → ready. */
function OnboardingPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const { user } = useSession()
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

  /** Device-local fast-path, scoped to this account (see stores/onboarding). */
  const dismissLocally = () => {
    if (user) dismiss(user.id)
  }

  // Adopt the device's zone as the profile's. `profiles.timezone` defaults to
  // 'UTC' and nothing else writes it except the manual picker in Settings, so
  // without this every new user's "today" is UTC's — someone in UTC+3 would see
  // yesterday's dashboard until 03:00 and log completions against the wrong
  // day. Safe to set here and only here: onboarding runs once per account
  // (gated server-side on `onboarded`), so it can never overwrite a zone the
  // user deliberately picked later.
  const persistOnboarded = () =>
    void update({ onboarded: true, timezone: browserTimezone() }).catch((error) => {
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
  const complete = (withHabits: boolean, openForm = false) => {
    if (saving) return
    setSaving(true)
    applyModules()
    const chosen = withHabits ? HABIT_TEMPLATES.filter((tpl) => picks.has(tpl.key)) : []
    if (chosen.length > 0) {
      // The habit is created with the name the user is reading, not the English
      // one. Not awaited: each shows up at once and queues if offline.
      for (const tpl of chosen) {
        create.mutate(toInput(tpl, t(`onboarding.suggestions.${tpl.key}`)), {
          onError: (error) => toast.error(toUserError(error, t, 'onboarding.createFailed')),
        })
      }
      toast.success(t('onboarding.habitsAdded', { count: chosen.length }))
    }
    dismissLocally()
    persistOnboarded()
    navigate(chosen.length > 0 || openForm ? '/habits' : '/')
    if (openForm) openNewHabit()
  }

  // Bail out early (top "Skip"): keep defaults, create nothing.
  const skip = () => {
    dismissLocally()
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
        {t('onboarding.stepOf', { step: step + 1, total: STEP_COUNT })}
      </div>

      <div className="relative w-full max-w-[520px] text-center">
        {step === 0 ? <WelcomeStep /> : null}
        {step === 1 ? <ModulesStep modules={modules} onToggle={toggleModule} /> : null}
        {step === 2 ? <TemplatesStep picks={picks} onToggle={togglePick} /> : null}
        {step === 3 ? <ReadyStep count={picks.size} /> : null}

        <div
          className="mt-8 flex items-center justify-center gap-2"
          role="tablist"
          aria-label={t('onboarding.progress')}
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
                    {saving
                      ? t('onboarding.settingUp')
                      : t('onboarding.addAndStart', { count: picks.size })}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t('onboarding.firstHabit')}
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
                {t('onboarding.exploreFirst')}
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={next} className="shadow-glow">
                {t('onboarding.continue')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="border" onClick={skip}>
                {t('onboarding.skip')}
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
            {t('onboarding.back')}
          </button>
        ) : null}
      </div>
    </main>
  )
}

export default OnboardingPage
