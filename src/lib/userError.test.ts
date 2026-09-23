import { describe, expect, it } from 'vitest'
import { translate } from '@/i18n'
import type { TFunction } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

const en: TFunction = (key, vars) => translate('en', key, vars)
const ru: TFunction = (key, vars) => translate('ru', key, vars)

describe('toUserError', () => {
  it('says "no connection" for a request that never got an answer', () => {
    const offline = { message: 'TypeError: Failed to fetch', code: '' }
    expect(toUserError(offline, ru, 'habits.saveFailed')).toBe(ru('errors.network'))
    expect(toUserError(new TypeError('Load failed'), en, 'habits.saveFailed')).toBe(
      en('errors.network'),
    )
  })

  it('names a duplicate, an RLS refusal and an expired session', () => {
    expect(toUserError({ code: '23505', message: 'duplicate key' }, ru, 'habits.saveFailed')).toBe(
      'Уже сохранено',
    )
    expect(
      toUserError(
        { code: '42501', message: 'new row violates row-level security policy' },
        ru,
        'habits.saveFailed',
      ),
    ).toBe('Нет доступа')
    expect(toUserError({ code: 'PGRST301', message: 'JWT expired' }, en, 'habits.saveFailed')).toBe(
      en('errors.sessionExpired'),
    )
  })

  it('reads Supabase Auth codes before the HTTP status', () => {
    const wrongPassword = { name: 'AuthApiError', code: 'invalid_credentials', status: 400 }
    expect(toUserError(wrongPassword, ru, 'auth.genericError')).toBe(
      ru('errors.invalidCredentials'),
    )
    const tooMany = { name: 'AuthApiError', code: 'unknown_code', status: 429 }
    expect(toUserError(tooMany, ru, 'auth.genericError')).toBe(ru('errors.rateLimited'))
  })

  it('treats a dismissed passkey prompt as a cancel, not a failure', () => {
    const dismissed = new DOMException('The operation was aborted', 'NotAllowedError')
    expect(toUserError(dismissed, en, 'auth.passkeyFailed')).toBe(en('errors.passkeyCancelled'))
  })

  it('never shows a raw message; anything unknown gets the call site line', () => {
    const technical = new Error('No mutationFn found')
    expect(toUserError(technical, ru, 'habits.saveFailed')).toBe(ru('habits.saveFailed'))
    expect(toUserError(undefined, ru, 'habits.saveFailed')).toBe(ru('habits.saveFailed'))
  })
})
