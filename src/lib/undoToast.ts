import { toast } from 'sonner'

/** How long an Undo stays on screen — long enough to read, short enough to be clearly "just now". */
export const UNDO_WINDOW_MS = 5000

/** A success toast whose action reverses what just happened. */
export function toastWithUndo(message: string, undoLabel: string, onUndo: () => void): void {
  toast.success(message, {
    duration: UNDO_WINDOW_MS,
    action: { label: undoLabel, onClick: onUndo },
  })
}
