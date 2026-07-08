import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'

const schema = z.object({
  displayName: z.string().trim().min(1, 'Required').optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

type FormValues = z.infer<typeof schema>
type Mode = 'signin' | 'signup'

function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
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

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-2 text-center">
        <p className="label-mono">// almanac</p>
        <h1 className="text-3xl">Where am I headed?</h1>
        <p className="text-sm text-muted">
          {mode === 'signin' ? 'Sign in to your command center.' : 'Create your command center.'}
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {mode === 'signup' && (
            <Field label="Name" error={errors.displayName?.message}>
              <Input placeholder="Ada" autoComplete="name" {...register('displayName')} />
            </Field>
          )}
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              {...register('password')}
            />
          </Field>
          <Button type="submit" size="lg" disabled={pending} className="mt-1">
            {pending ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </Card>

      <button
        type="button"
        onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
        className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        {mode === 'signin' ? 'No account? Create one' : 'Have an account? Sign in'}
      </button>
    </main>
  )
}

interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label asChild>
        <span>{label}</span>
      </Label>
      {children}
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </label>
  )
}

export default AuthPage
