import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { usePasskeys } from '@/features/settings/hooks/usePasskeys'
import { passkeysSupported } from '@/lib/webauthn'
import { useT } from '@/hooks/useT'

interface PasskeysSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Register / rename / delete passkeys for the signed-in account. Ships ahead
 * of the server side being enabled — see handoff.md's "RET-8 passkeys" note
 * for the one Dashboard step this depends on; until then every action here
 * fails with a clear `passkey_disabled` message rather than doing nothing.
 */
export function PasskeysSheet({ open, onOpenChange }: PasskeysSheetProps) {
  const { t } = useT()
  const { passkeys, isLoading, register, rename, remove } = usePasskeys()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const onRegister = async () => {
    try {
      await register.mutateAsync()
      toast.success(t('settings.passkeyAdded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.passkeyAddFailed'))
    }
  }

  const startRename = (id: string, current: string) => {
    setRenamingId(id)
    setDraftName(current)
  }

  const saveRename = async (id: string) => {
    try {
      await rename.mutateAsync({ id, name: draftName.trim() || t('settings.passkeyDefaultName') })
      setRenamingId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.passkeyRenameFailed'))
    }
  }

  const onDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t('settings.passkeyDeleted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.passkeyDeleteFailed'))
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('settings.passkeysTitle')}
      description={t('settings.passkeysDescription')}
    >
      <div className="flex flex-col gap-4">
        {!passkeysSupported() ? (
          <p className="text-xs text-muted">{t('settings.passkeysUnsupported')}</p>
        ) : null}

        {isLoading ? (
          <p className="text-xs text-muted">{t('settings.passkeysLoading')}</p>
        ) : passkeys.length === 0 ? (
          <p className="text-xs text-muted">{t('settings.passkeysEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex items-center gap-3 rounded-tile border bg-surface px-3 py-2.5"
              >
                <KeyRound className="h-4 w-4 flex-none text-muted-strong" aria-hidden="true" />
                {renamingId === passkey.id ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => saveRename(passkey.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveRename(passkey.id)}
                    maxLength={120}
                    className="min-w-0 flex-1 rounded border bg-bg-deep px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      startRename(
                        passkey.id,
                        passkey.friendly_name ?? t('settings.passkeyDefaultName'),
                      )
                    }
                    className="min-w-0 flex-1 truncate text-left text-sm hover:text-accent"
                  >
                    {passkey.friendly_name ?? t('settings.passkeyDefaultName')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(passkey.id)}
                  aria-label={t('settings.passkeyDelete')}
                  className="flex-none text-muted-strong hover:text-accent"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button
          size="lg"
          onClick={onRegister}
          disabled={register.isPending || !passkeysSupported()}
        >
          {register.isPending ? t('settings.passkeyAdding') : t('settings.passkeyAdd')}
        </Button>
      </div>
    </Sheet>
  )
}
