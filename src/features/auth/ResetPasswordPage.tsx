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
import { useT } from '@/hooks/useT'

const schema = z.object({
  password: z.string().min(6, 'auth.passwordTooShort'),
})

type FormValues = z.infer<typeof schema>

/** Landing page for the password-reset email link (recovery session). */
function ResetPasswordPage() {
  const { t } = useT()
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
      toast.success(t('auth.reset.updated'))
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.reset.failed'))
    }
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="label-mono">// almanac</p>
        <h1 className="mt-1 text-3xl">{t('auth.reset.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {status === 'authenticated' ? t('auth.reset.hint') : t('auth.reset.expired')}
        </p>
      </div>

      {status === 'authenticated' ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono">{t('auth.reset.newPassword')}</span>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
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
            {setPassword.isPending ? t('auth.working') : t('auth.reset.submit')}
          </Button>
        </form>
      ) : (
        <Button asChild size="lg" variant="surface">
          <Link to="/auth">{t('auth.reset.back')}</Link>
        </Button>
      )}
    </main>
  )
}

export default ResetPasswordPage
