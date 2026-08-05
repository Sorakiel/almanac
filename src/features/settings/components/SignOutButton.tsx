import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useT } from '@/hooks/useT'

interface SignOutButtonProps {
  className?: string
}

/**
 * Sign out, behind a confirmation.
 *
 * Signing out destroys nothing — the data is on the server — but it sits at the
 * bottom of a scrolling settings list on mobile, where a mis-tap costs you a
 * password entry to undo. Cheap to confirm, annoying to hit by accident.
 *
 * Owns its own state so both shells (the mobile page and the desktop rail) get
 * the same behaviour from one place.
 */
export function SignOutButton({ className }: SignOutButtonProps) {
  const { t } = useT()
  const { logOut } = useAuthActions()
  const [confirming, setConfirming] = useState(false)

  const signOut = async () => {
    setConfirming(false)
    try {
      await logOut.mutateAsync()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.signOut'))
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setConfirming(true)}
        disabled={logOut.isPending}
      >
        {t('settings.signOut')}
      </Button>
      {confirming ? (
        <ConfirmSheet
          open
          onOpenChange={setConfirming}
          title={t('settings.signOutConfirm')}
          description={t('settings.signOutConfirmHint')}
          confirmLabel={t('settings.signOut')}
          pending={logOut.isPending}
          onConfirm={() => void signOut()}
        />
      ) : null}
    </>
  )
}
