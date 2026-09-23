/** Postgres unique_violation — for an insert with a client-chosen id, "already saved". */
export const UNIQUE_VIOLATION = '23505'

export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === UNIQUE_VIOLATION
}
