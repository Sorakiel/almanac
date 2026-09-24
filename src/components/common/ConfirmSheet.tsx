import { useRef, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useT } from '@/hooks/useT'

interface ConfirmSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: ReactNode
  pending?: boolean
  onConfirm: () => void
}

/**
 * Red confirm for an irreversible action, as an iOS action sheet: a glass card
 * with the question and the red action, and "Cancel" apart below it. Cancel
 * takes the focus, so Enter never destroys anything by accident. Centred on
 * desktop, where the bottom of a wide window is nowhere near the pointer.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
}: ConfirmSheetProps) {
  const { t } = useT()
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="action-sheet-scrim fixed inset-0 z-[60] bg-black/30" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            cancelRef.current?.focus()
          }}
          className="action-sheet fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[420px] px-2.5 pb-[max(env(safe-area-inset-bottom),10px)] focus:outline-none lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
        >
          <div className="lg mb-2 overflow-hidden rounded-[22px]">
            <div className="px-[18px] py-3.5 text-center text-footnote text-muted">
              <Dialog.Title className="font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className="h-[54px] w-full border-t border-foreground/10 text-[18px] font-medium text-danger transition-colors hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
          <Dialog.Close
            ref={cancelRef}
            className="lg h-[54px] w-full rounded-[22px] text-[18px] font-semibold text-foreground focus-visible:ring-offset-0"
          >
            {t('common.cancel')}
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
