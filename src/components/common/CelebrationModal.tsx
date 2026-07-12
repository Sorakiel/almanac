import * as Dialog from '@radix-ui/react-dialog'
import { PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CelebrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  /** CTA label; defaults to a simple dismiss. */
  actionLabel?: string
}

/** Centered congratulatory modal — shown when a goal is fully completed. */
export function CelebrationModal({
  open,
  onOpenChange,
  title,
  message,
  actionLabel = 'Nice',
}: CelebrationModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg-deep/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[380px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-accent/30 bg-bg p-8 text-center shadow-glow focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent"
          />
          <div className="relative flex flex-col items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-accent to-accent-deep text-on-accent shadow-glow">
              <PartyPopper className="h-8 w-8" aria-hidden="true" />
            </span>
            <Dialog.Title className="text-2xl font-semibold tracking-title">{title}</Dialog.Title>
            <Dialog.Description className="text-[15px] leading-relaxed text-muted">
              {message}
            </Dialog.Description>
            <Button
              size="lg"
              className="mt-2 w-full shadow-glow"
              onClick={() => onOpenChange(false)}
            >
              {actionLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
