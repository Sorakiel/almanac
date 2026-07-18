import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { AuthBrandPanel } from '@/features/auth/components/AuthBrandPanel'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { MIN_ACCEPTED_LEVEL, scorePassword } from '@/features/auth/passwordStrength'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useSession } from '@/hooks/useSession'
import { setRememberMe } from '@/lib/supabase'

const schema = z.object({
  // Optional in both modes: signup falls back to the email prefix when blank.
  // No min-length — a stale/autofilled empty value on the hidden signin field
  // must never silently block submit (the input isn't even rendered there).
  displayName: z.string().trim().optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

type FormValues = z.infer<typeof schema>
type Mode = 'signin' | 'signup'

function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [forgot, setForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const { status } = useSession()
  const { signIn, signUp, magicLink, resetRequest } = useAuthActions()
  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })

  const pending =
    signIn.isPending || signUp.isPending || resetRequest.isPending || magicLink.isPending

  // Live strength gate — only enforced on signup; existing accounts sign in
  // with whatever password they already have.
  const passwordValue = useWatch({ control, name: 'password' }) ?? ''
  const passwordStrongEnough = scorePassword(passwordValue).level >= MIN_ACCEPTED_LEVEL
  const submitBlocked = pending || (mode === 'signup' && !passwordStrongEnough)

  const onMagicLink = async () => {
    const email = getValues('email').trim()
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error('Enter your email above first, then tap the magic link.')
      return
    }
    try {
      setRememberMe(remember)
      await magicLink.mutateAsync(email)
      toast.success('Magic link sent — check your inbox to sign in.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the magic link')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setRememberMe(remember)
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp.mutateAsync({
          email: values.email,
          password: values.password,
          displayName: values.displayName?.trim() || values.email.split('@')[0]!,
        })
        if (needsConfirmation) {
          toast.success('Almost there — check your email to confirm your account.')
          setMode('signin')
        } else {
          toast.success('Account created — welcome to Almanac.')
        }
      } else {
        await signIn.mutateAsync({ email: values.email, password: values.password })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  })

  const onForgot = async () => {
    const email = getValues('email').trim()
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error('Enter your email above first, then tap Forgot again.')
      return
    }
    try {
      await resetRequest.mutateAsync(email)
      setForgot(true)
      toast.success('Reset link sent — check your inbox.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the reset link')
    }
  }

  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <div className="flex min-h-dvh">
      <AuthBrandPanel />
      <main className="flex flex-1 items-center justify-center px-6 pb-[max(env(safe-area-inset-bottom),3rem)] pt-[max(env(safe-area-inset-top),3rem)]">
        <div className="flex w-full max-w-sm flex-col gap-6 lg:max-w-[400px]">
          <div className="flex flex-col gap-4">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-accent to-accent-deep shadow-glow lg:hidden">
              <span aria-hidden="true" className="h-3.5 w-3.5 rotate-45 border-[1.8px] border-bg" />
            </span>
            <div>
              <h1 className="text-3xl">{mode === 'signin' ? 'Welcome back' : 'Get started'}</h1>
              <p className="mt-1 text-sm text-muted">
                {mode === 'signin' ? 'Pick up where you left off.' : 'Build your command center.'}
              </p>
            </div>
          </div>

          <Segmented
            aria-label="Authentication mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Create account' },
            ]}
          />

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {mode === 'signup' && (
              <label className="flex flex-col gap-1.5">
                <span className="label-mono">Name</span>
                <Input
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  {...register('displayName')}
                />
                {errors.displayName ? (
                  <span className="text-xs text-accent">{errors.displayName.message}</span>
                ) : null}
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="label-mono">Email</span>
              <Input
                type="email"
                placeholder="you@almanac.app"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email ? (
                <span className="text-xs text-accent">{errors.email.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="label-mono">Password</span>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="pr-14"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 my-auto h-fit font-mono text-[10px] uppercase tracking-label text-muted hover:text-foreground"
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
              {errors.password ? (
                <span className="text-xs text-accent">{errors.password.message}</span>
              ) : null}
            </label>

            {mode === 'signup' && passwordValue.length > 0 ? (
              <div className="duration-500 animate-in fade-in slide-in-from-top-2">
                <PasswordStrengthMeter password={passwordValue} />
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                Remember me
              </label>
              {mode === 'signin' ? (
                <button
                  type="button"
                  onClick={onForgot}
                  disabled={resetRequest.isPending}
                  className="font-mono text-[11px] tracking-label text-accent hover:text-accent-deep"
                >
                  {forgot ? 'Link sent ✓' : 'Forgot?'}
                </button>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitBlocked}
              className="shadow-glow transition-opacity"
            >
              {pending
                ? 'One moment…'
                : mode === 'signup' && !passwordStrongEnough
                  ? 'Strengthen your password'
                  : mode === 'signin'
                    ? 'Sign in →'
                    : 'Create account →'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="ghost"
            className="w-full border bg-transparent font-semibold"
            onClick={onMagicLink}
            disabled={magicLink.isPending}
          >
            {magicLink.isPending ? 'Sending…' : '✦ Email me a magic link'}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default AuthPage
