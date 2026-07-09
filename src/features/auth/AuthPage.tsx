import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Diamond } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useSession } from '@/hooks/useSession'

const schema = z.object({
  displayName: z.string().trim().min(1, 'Required').optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

type FormValues = z.infer<typeof schema>
type Mode = 'signin' | 'signup'

function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const { status } = useSession()
  const { signIn, signUp } = useAuthActions()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const pending = signIn.isPending || signUp.isPending

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mode === 'signup') {
        await signUp.mutateAsync({
          email: values.email,
          password: values.password,
          displayName: values.displayName?.trim() || values.email.split('@')[0]!,
        })
        toast.success('Account created — welcome to Almanac.')
      } else {
        await signIn.mutateAsync({ email: values.email, password: values.password })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  })

  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-accent text-on-accent">
          <Diamond className="h-6 w-6" aria-hidden="true" />
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
            <Input placeholder="Ada Lovelace" autoComplete="name" {...register('displayName')} />
            {errors.displayName ? (
              <span className="text-xs text-accent">{errors.displayName.message}</span>
            ) : null}
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="label-mono">Email</span>
          <Input type="email" placeholder="you@almanac.app" autoComplete="email" {...register('email')} />
          {errors.email ? <span className="text-xs text-accent">{errors.email.message}</span> : null}
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

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'One moment…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="label-mono">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="surface" onClick={() => toast('Social sign-in is coming soon.')}>
          Apple
        </Button>
        <Button variant="surface" onClick={() => toast('Social sign-in is coming soon.')}>
          G · Google
        </Button>
      </div>
    </main>
  )
}

export default AuthPage
