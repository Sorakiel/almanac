import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { SettingsItem } from '@/features/profile/components/SettingsItem'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

/**
 * «Выйти» as the last red row, behind a confirm: nothing is lost by signing
 * out, but it sits at the bottom of a long scroll where a mis-tap costs a
 * password to undo.
 */
export function SignOutItem() {
  const { t } = useT()
  const { logOut } = useAuthActions()
  const [confirming, setConfirming] = useState(false)

  const signOut = async () => {
    setConfirming(false)
    try {
      await logOut.mutateAsync()
    } catch (error) {
      toast.error(toUserError(error, t, 'errors.signOut'))
    }
  }

  return (
    <>
      <SettingsItem
        label={t('settings.signOut')}
        tone="danger"
        center
        onClick={() => setConfirming(true)}
      />
      <ConfirmSheet
        open={confirming}
        onOpenChange={setConfirming}
        title={t('settings.signOutConfirm')}
        description={t('settings.signOutConfirmHint')}
        confirmLabel={t('settings.signOut')}
        pending={logOut.isPending}
        onConfirm={() => void signOut()}
      />
    </>
  )
}
