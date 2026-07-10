import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useSession } from '@/hooks/useSession'

const schema = z.object({
  password: z.string().min(6, 'At least 6 characters'),
})

type FormValues = z.infer<typeof schema>

/** Landing page for the password-reset email link (recovery session). */
function ResetPasswordPage() {
  const navigate = useNavigate()
  const { status } = useSession()
  const { setPassword } = useAuthActions()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await setPassword.mutateAsync(values.password)
      toast.success('Password updated — you are signed in.')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the password')
    }
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="label-mono">// almanac</p>
        <h1 className="mt-1 text-3xl">Set a new password</h1>
        <p className="mt-1 text-sm text-muted">
          {status === 'authenticated'
            ? 'Pick something you will remember this time.'
            : 'This reset link has expired or was already used.'}
        </p>
      </div>

      {status === 'authenticated' ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">New password</span>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
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

          <Button type="submit" size="lg" disabled={setPassword.isPending} className="shadow-glow">
            {setPassword.isPending ? 'One moment…' : 'Save new password →'}
          </Button>
        </form>
      ) : (
        <Button asChild size="lg" variant="surface">
          <Link to="/auth">Back to sign in</Link>
        </Button>
      )}
    </main>
  )
}

export default ResetPasswordPage
