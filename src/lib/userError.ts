import type { TFunction } from '@/hooks/useT'
import type { TranslationKey } from '@/i18n/types'
import { isNetworkError } from '@/lib/network'

/**
 * Server codes worth a sentence of their own. Everything else falls back to
 * the call site's "Could not …" line: a raw `error.message` is English, often
 * technical ("new row violates row-level security policy"), and never helps.
 */
const BY_CODE = new Map<string, TranslationKey>(
  Object.entries({
    // Postgres / PostgREST
    '23505': 'errors.duplicate', // unique violation — the thing is already there
    '42501': 'errors.forbidden', // RLS refused the row
    PGRST301: 'errors.sessionExpired', // JWT expired
    PGRST302: 'errors.sessionExpired', // no JWT at all
    // Supabase Auth
    invalid_credentials: 'errors.invalidCredentials',
    email_not_confirmed: 'errors.emailNotConfirmed',
    user_already_exists: 'errors.emailTaken',
    email_exists: 'errors.emailTaken',
    weak_password: 'errors.weakPassword',
    same_password: 'errors.samePassword',
    over_email_send_rate_limit: 'errors.rateLimited',
    over_request_rate_limit: 'errors.rateLimited',
    session_expired: 'errors.sessionExpired',
    session_not_found: 'errors.sessionExpired',
    refresh_token_not_found: 'errors.sessionExpired',
    passkey_disabled: 'errors.passkeyUnavailable',
  } satisfies Record<string, TranslationKey>),
)

const BY_STATUS = new Map<number, TranslationKey>([
  [401, 'errors.sessionExpired'],
  [403, 'errors.forbidden'],
  [409, 'errors.duplicate'],
  [429, 'errors.rateLimited'],
])

function field(error: unknown, name: string): unknown {
  return typeof error === 'object' && error !== null
    ? (error as Record<string, unknown>)[name]
    : undefined
}

/**
 * The sentence a person should read when `error` stops what they were doing.
 *
 * `fallback` is the call site's own "Could not save the habit" — used whenever
 * the cause has nothing more useful to say. A write that is merely queued
 * offline never reaches here: a paused mutation does not call `onError`, so
 * any failure that does is final and worth saying.
 */
export function toUserError(error: unknown, t: TFunction, fallback: TranslationKey): string {
  if (isNetworkError(error)) return t('errors.network')

  // The browser's own answer when a passkey prompt is dismissed or times out.
  const name = field(error, 'name')
  if (name === 'NotAllowedError' || name === 'AbortError') return t('errors.passkeyCancelled')

  const code = field(error, 'code')
  const status = field(error, 'status')
  const key =
    (typeof code === 'string' ? BY_CODE.get(code) : undefined) ??
    (typeof status === 'number' ? BY_STATUS.get(status) : undefined) ??
    fallback
  return t(key)
}
