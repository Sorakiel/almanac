import * as Dialog from '@radix-ui/react-dialog'
import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

const CLOSE_MS = 260

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
  const contentRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  // Refs drive the gesture (synchronous, no stale closures); state only mirrors
  // the offset for rendering the transform.
  const draggingRef = useRef(false)
  const dragYRef = useRef(0)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Reset the drag offset whenever the sheet (re)opens, so a swipe-close never
  // leaves it translated off-screen on the next open. Layout effect = no flash;
  // this is transient UI state synced to the `open` prop, not derived data.
  useLayoutEffect(() => {
    if (open && dragYRef.current !== 0) {
      dragYRef.current = 0
      setDragY(0)
    }
  }, [open])

  // Drag-to-dismiss on the grab handle (mobile only — the handle is hidden at
  // lg, so desktop's centered modal never drags). Follow the finger down; past
  // a threshold, hand off to Radix to run its normal close animation.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    startY.current = event.clientY
    draggingRef.current = true
    setDragging(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic/edge pointers can't be captured — the drag still works.
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const y = Math.max(0, event.clientY - startY.current)
    dragYRef.current = y
    setDragY(y)
  }

  const onPointerUp = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    const height = contentRef.current?.offsetHeight ?? window.innerHeight
    const threshold = Math.min(120, height * 0.25)
    // Reliable dismissal: hand off to Radix (its proven close animation) rather
    // than sliding out ourselves and risking a stranded, half-open sheet.
    if (dragYRef.current > threshold) onOpenChange(false)
    dragYRef.current = 0
    setDragY(0)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg-deep/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content
          ref={contentRef}
          onOpenAutoFocus={preventInitialFocus ? (event) => event.preventDefault() : undefined}
          style={
            dragY > 0
              ? {
                  transform: `translateY(${dragY}px)`,
                  transition: dragging
                    ? 'none'
                    : `transform ${CLOSE_MS}ms cubic-bezier(0.32,0.72,0,1)`,
                }
              : undefined
          }
          className={cn(
            'fixed z-50 border bg-bg shadow-soft focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out',
            // Mobile: bottom sheet that slides up. Cap the height and scroll
            // inside so tall forms (and the on-screen keyboard) never push the
            // sheet past the top of the screen where it can't be dismissed.
            'inset-x-0 bottom-0 mx-auto max-h-[90dvh] max-w-md overflow-y-auto rounded-t-sheet p-6 pb-8',
            // Skip Radix's slide keyframes while a drag is in flight, else the
            // inline transform and the keyframe fight each other.
            dragY === 0 &&
              'max-lg:data-[state=open]:slide-in-from-bottom max-lg:data-[state=closed]:slide-out-to-bottom',
            // Desktop: centered modal dialog (spec board "NEW HABIT · MODAL").
            'lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:mx-0 lg:w-[520px] lg:max-w-[calc(100vw-2rem)]',
            'lg:max-h-[calc(100vh-4rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:overflow-y-auto lg:rounded-[24px] lg:px-8 lg:py-7',
          )}
        >
          {/* Grab handle — drag down to dismiss (mobile). */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="-mt-2 mb-2 flex cursor-grab touch-none justify-center py-2 active:cursor-grabbing lg:hidden"
          >
            <span aria-hidden="true" className="h-1 w-10 rounded-full bg-border" />
          </div>
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
