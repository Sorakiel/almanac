import type { ComponentType } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/common/Confetti'

interface CelebrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  /** Badge glyph. Defaults to a party popper. */
  icon?: ComponentType<{ className?: string }>
  /** CTA label; defaults to a simple dismiss. */
  actionLabel?: string
}

/** Centered congratulatory scene — a badge that pops with a diagonal sheen,
 *  confetti, and a headline. Used for goal completions and achievement unlocks. */
export function CelebrationModal({
  open,
  onOpenChange,
  title,
  message,
  icon: Icon = PartyPopper,
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
          {open ? <Confetti /> : null}
          <div className="relative flex flex-col items-center gap-4">
            <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-accent to-accent-deep text-on-accent shadow-glow motion-safe:animate-pop">
              <Icon className="h-8 w-8" />
              {/* Diagonal gloss sweeping once across the badge. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-shine"
              />
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
