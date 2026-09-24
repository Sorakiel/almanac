import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { detentOffset, dragOffset, settleDrag, type Detent } from '@/lib/detents'

interface DetentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  detent: Detent
  onDetentChange: (detent: Detent) => void
  children: ReactNode
}

// Mirrors `.detent-sheet` in globals.css: the sheet is the viewport minus 60 px.
const TOP_GAP = 60
const DESKTOP = '(min-width: 1024px)'

/**
 * A bottom sheet with two resting heights (the prototype's Create sheet). The
 * whole header is the grab area: drag between medium and large, or down to
 * dismiss. A visible close button and Escape close it too. At lg it is a
 * centred modal and does not drag. Geometry and motion live in `.detent-sheet`.
 */
export function DetentSheet({
  open,
  onOpenChange,
  title,
  detent,
  onDetentChange,
  children,
}: DetentSheetProps) {
  const { t } = useT()
  const drag = useRef<{ startY: number; pointerY: number; height: number } | null>(null)
  const [dragY, setDragY] = useState<number | null>(null)

  const restingY = (height: number) => detentOffset(detent, height)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    if (window.matchMedia(DESKTOP).matches) return
    const height = window.innerHeight - TOP_GAP
    drag.current = { startY: restingY(height), pointerY: event.clientY, height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setDragY(dragOffset(drag.current.startY, event.clientY - drag.current.pointerY))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    drag.current = null
    const y = dragOffset(state.startY, event.clientY - state.pointerY)
    setDragY(null)
    const next = settleDrag(y, state.startY, state.height)
    if (next === 'closed') onOpenChange(false)
    else onDetentChange(next)
  }

  const style = {
    '--sheet-y': `${dragY ?? restingY(window.innerHeight - TOP_GAP)}px`,
  } as CSSProperties

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content
          style={style}
          data-dragging={dragY !== null ? '' : undefined}
          className="detent-sheet z-50 flex flex-col overflow-hidden bg-sheet text-foreground focus:outline-none"
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="flex-none cursor-grab touch-none active:cursor-grabbing lg:cursor-auto"
          >
            <div aria-hidden="true" className="grid h-7 place-items-center lg:hidden">
              <span className="h-1.5 w-10 rounded-full bg-muted-strong/60" />
            </div>
            <div className="flex items-center justify-between pb-2.5 pl-5 pr-4 lg:pb-3 lg:pl-6 lg:pt-5">
              <Dialog.Title className="text-headline font-bold">{title}</Dialog.Title>
              <Dialog.Close
                aria-label={t('common.close')}
                className="grid h-9 w-9 place-items-center rounded-full bg-sheet-fill text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          <div className="flex-1 overflow-y-auto px-4 pb-6 lg:px-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
