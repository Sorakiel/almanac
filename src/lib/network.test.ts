import { afterEach, describe, expect, it, vi } from 'vitest'
import { MutationObserver, QueryClient, onlineManager } from '@tanstack/react-query'
import {
  MAX_WRITE_ATTEMPTS,
  isNetworkError,
  retryNetworkErrors,
  syncOnlineStateFromBrowser,
} from '@/lib/network'

// The exact shape postgrest-js resolves with when fetch rejects.
const postgrestOffline = { message: 'TypeError: Failed to fetch', details: '', hint: '', code: '' }

describe('isNetworkError', () => {
  it('recognises a failed fetch in every shape it reaches us', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkError(postgrestOffline)).toBe(true)
    expect(isNetworkError({ message: 'TypeError: Load failed', code: '' })).toBe(true)
    expect(isNetworkError({ name: 'FunctionsFetchError', message: 'Failed to send' })).toBe(true)
  })

  it('does not treat an answered request as a network failure', () => {
    expect(isNetworkError({ message: 'duplicate key value', code: '23505' })).toBe(false)
    expect(isNetworkError({ message: 'new row violates row-level security', code: '42501' })).toBe(
      false,
    )
    expect(isNetworkError(new Error('No mutationFn found'))).toBe(false)
    expect(isNetworkError(null)).toBe(false)
  })
})

describe('retryNetworkErrors', () => {
  it(`allows ${MAX_WRITE_ATTEMPTS} attempts for a network failure`, () => {
    expect(retryNetworkErrors(0, postgrestOffline)).toBe(true)
    expect(retryNetworkErrors(MAX_WRITE_ATTEMPTS - 2, postgrestOffline)).toBe(true)
    expect(retryNetworkErrors(MAX_WRITE_ATTEMPTS - 1, postgrestOffline)).toBe(false)
  })

  it('never retries a server refusal', () => {
    expect(retryNetworkErrors(0, { message: 'conflict', code: '23505' })).toBe(false)
  })
})

describe('offline cold start', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    onlineManager.setOnline(true)
  })

  it('pauses a write made on a page that loaded offline instead of failing it', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    syncOnlineStateFromBrowser()

    const client = new QueryClient({ defaultOptions: { mutations: { retry: retryNetworkErrors } } })
    const mutationFn = vi.fn(async () => {
      throw postgrestOffline
    })
    const observer = new MutationObserver(client, { mutationFn })
    void observer.mutate().catch(() => undefined)
    await Promise.resolve()

    expect(observer.getCurrentResult().isPaused).toBe(true)
    expect(mutationFn).not.toHaveBeenCalled()
  })
})
