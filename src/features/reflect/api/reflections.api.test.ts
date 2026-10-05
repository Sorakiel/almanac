import { describe, expect, it, vi } from 'vitest'
import { restoreReflection } from '@/features/reflect/api/reflections.api'
import type { Reflection } from '@/features/reflect/types'

const insert = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ insert }) } }))

const reflection = { id: 'r1', user_id: 'u1', date: '2026-10-05' } as Reflection

describe('restoreReflection', () => {
  it('treats its own id already being there as restored — safe to send twice', async () => {
    insert.mockResolvedValueOnce({ error: { code: '23505' } })
    await expect(restoreReflection(reflection)).resolves.toBeUndefined()
  })

  it('still fails on any other error', async () => {
    insert.mockResolvedValueOnce({ error: { code: '42501', message: 'denied' } })
    await expect(restoreReflection(reflection)).rejects.toMatchObject({ code: '42501' })
  })
})
