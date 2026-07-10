import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'

interface ConfirmSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: ReactNode
  pending?: boolean
  onConfirm: () => void
}

/** Bottom-sheet confirmation for destructive actions. */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex flex-col gap-3">
        <Button variant="danger" size="lg" disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </div>
    </Sheet>
  )
}
