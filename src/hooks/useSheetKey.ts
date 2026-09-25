import { useState } from 'react'

/**
 * Sheets stay mounted and are driven by `open` alone, so Radix can play the
 * exit animation — unmounting on close cut it off. Their forms still have to
 * start fresh on every opening, so key the sheet with this: the number moves
 * on each closed → open transition (remounting as it opens, not as it closes).
 *
 * Derived during render from the previous `open`, not in an effect, so the
 * new key lands in the same render the sheet opens.
 */
export function useOpenKey(open: boolean): number {
  const [prev, setPrev] = useState({ open, key: 0 })
  if (prev.open !== open) {
    const key = open ? prev.key + 1 : prev.key
    setPrev({ open, key })
    return key
  }
  return prev.key
}

/**
 * The same for a set of sheets where at most one is open, named by id:
 * `keyOf(id)` moves each time that id opens.
 */
export function useOpenKeys<T extends string>(open: T | null): (id: T) => number {
  const [prev, setPrev] = useState<{ open: T | null; keys: Partial<Record<T, number>> }>({
    open,
    keys: {},
  })
  let keys = prev.keys
  if (prev.open !== open) {
    if (open !== null) keys = { ...keys, [open]: (keys[open] ?? 0) + 1 }
    setPrev({ open, keys })
  }
  return (id: T) => keys[id] ?? 0
}

/**
 * The last non-empty value: a sheet closing on `null` keeps showing what it
 * showed while it slides out, instead of flashing its empty state.
 */
export function useLastValue<T>(value: T | null | undefined): T | null | undefined {
  const [last, setLast] = useState(value)
  if (value != null && value !== last) {
    setLast(value)
    return value
  }
  return value ?? last
}
