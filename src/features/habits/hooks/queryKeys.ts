/** Namespaced React Query keys for the habits feature. */
export const habitKeys = {
  all: (userId: string) => ['habits', userId] as const,
  /**
   * Logs from `from` (inclusive) onward. The window start belongs in the key, so
   * screens needing different depths share one namespace and differ only in
   * their entry — rather than each inventing a namespace of its own, which is
   * how the insights copy drifted out of every invalidation.
   */
  logsSince: (userId: string, from: string) => ['habitLogs', userId, 'since', from] as const,
  /** Every log window for a user — the invalidation target after a write. */
  logsRoot: (userId: string) => ['habitLogs', userId] as const,
  /** Freeze days from `from` (inclusive) onward. */
  freezesSince: (userId: string, from: string) => ['habitFreezes', userId, 'since', from] as const,
  /** Every freeze window for a user. */
  freezesRoot: (userId: string) => ['habitFreezes', userId] as const,
  /** One habit's row — `detailRoot` invalidates every open detail page. */
  detail: (habitId: string) => ['habit', habitId] as const,
  detailRoot: () => ['habit'] as const,
  /** One habit's log history; `dateKey` is part of the key so a new day refetches. */
  history: (habitId: string, dateKey?: string) =>
    (dateKey ? ['habitHistory', habitId, dateKey] : ['habitHistory', habitId]) as readonly string[],
  /** One habit's freeze days. */
  freezesOf: (habitId: string, dateKey?: string) =>
    (dateKey ? ['habitFreezes', habitId, dateKey] : ['habitFreezes', habitId]) as readonly string[],
  /** A single habit's checklist. */
  subtasks: (habitId: string) => ['habitSubtasks', habitId] as const,
}
