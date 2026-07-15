import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Render the title as a mono `// SECTION` micro-label (spec-board modals). */
  mono?: boolean
  /** Skip Radix's focus-first-field on open — avoids a stray ring on the name input. */
  preventInitialFocus?: boolean
  children: ReactNode
}

/** Bottom sheet built on Radix Dialog — used for forms and quick actions. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  mono,
  preventInitialFocus,
  children,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg-deep/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content
          onOpenAutoFocus={preventInitialFocus ? (event) => event.preventDefault() : undefined}
          className={cn(
            'fixed z-50 border bg-bg shadow-soft focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out',
            // Mobile: bottom sheet that slides up. Cap the height and scroll
            // inside so tall forms (and the on-screen keyboard) never push the
            // sheet past the top of the screen where it can't be dismissed.
            'inset-x-0 bottom-0 mx-auto max-h-[90dvh] max-w-md overflow-y-auto rounded-t-sheet p-6 pb-8',
            'max-lg:data-[state=open]:slide-in-from-bottom max-lg:data-[state=closed]:slide-out-to-bottom',
            // Desktop: centered modal dialog (spec board "NEW HABIT · MODAL").
            'lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:mx-0 lg:w-[520px] lg:max-w-[calc(100vw-2rem)]',
            'lg:max-h-[calc(100vh-4rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:overflow-y-auto lg:rounded-[24px] lg:px-8 lg:py-7',
          )}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border lg:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className={cn(mono ? 'label-mono' : 'text-lg font-semibold tracking-title')}>
              {mono ? `// ${title}` : title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="hidden text-[15px] leading-none text-muted-strong transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:block"
            >
              <span aria-hidden="true">✕</span>
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className="mt-1 text-sm text-muted">
              {description}
            </Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
