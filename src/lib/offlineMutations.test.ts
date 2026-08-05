import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, onlineManager, dehydrate, hydrate } from '@tanstack/react-query'
import { addFreeze, createHabit, setHabitCount } from '@/features/habits/api/habits.api'
import { updateWorkout } from '@/features/workouts/api/workouts.api'
import { OFFLINE_MUTATION_KEYS, registerOfflineMutations } from '@/lib/offlineMutations'
import type { HabitWithTodayLog } from '@/features/habits/types'

vi.mock('@/features/habits/api/habits.api', () => ({
  setHabitCount: vi.fn(async () => undefined),
  addFreeze: vi.fn(async () => undefined),
  removeFreeze: vi.fn(async () => undefined),
  createHabit: vi.fn(async () => ({ id: 'new-habit', frequency: 'daily' })),
  updateHabit: vi.fn(async () => undefined),
  archiveHabit: vi.fn(async () => undefined),
  updateHabitOrder: vi.fn(async () => undefined),
  createSubtask: vi.fn(async () => ({ id: 'new-subtask' })),
  deleteSubtask: vi.fn(async () => undefined),
  setSubtaskCompletedDates: vi.fn(async () => undefined),
}))
vi.mock('@/features/workouts/api/session.api', () => ({
  updateSet: vi.fn(async () => undefined),
}))
vi.mock('@/features/workouts/api/workouts.api', () => ({
  createWorkout: vi.fn(async () => ({ id: 'new-workout' })),
  updateWorkout: vi.fn(async () => ({ id: 'w1', completed_at: null })),
  deleteWorkout: vi.fn(async () => undefined),
}))

const habit = { id: 'h1', isComplete: false, todayCount: 0 } as HabitWithTodayLog

function shouldDehydrateMutation(mutation: {
  state: { isPaused: boolean }
  options: { mutationKey?: readonly unknown[] }
}) {
  return mutation.state.isPaused && mutation.options.mutationKey?.[0] === 'offline'
}

describe('offline mutation resume', () => {
  beforeEach(() => {
    vi.mocked(setHabitCount).mockClear()
    onlineManager.setOnline(true)
  })

  it('a live paused toggle does not run until resumePausedMutations is called', async () => {
    onlineManager.setOnline(false)
    const client = new QueryClient()
    registerOfflineMutations(client)

    const mutation = client
      .getMutationCache()
      .build(client, { mutationKey: OFFLINE_MUTATION_KEYS.toggleHabit })
    const pending = mutation.execute({ habit, userId: 'u1', date: '2026-08-05' })
    await new Promise((r) => setTimeout(r, 10))

    expect(mutation.state.isPaused).toBe(true)
    expect(setHabitCount).not.toHaveBeenCalled()

    onlineManager.setOnline(true)
    await client.resumePausedMutations()
    await pending

    expect(setHabitCount).toHaveBeenCalledWith({
      userId: 'u1',
      habitId: 'h1',
      date: '2026-08-05',
      count: 1,
    })
  })

  it('survives a reload: dehydrate a paused toggle, hydrate a fresh client, resume it', async () => {
    onlineManager.setOnline(false)
    const client1 = new QueryClient()
    registerOfflineMutations(client1)
    client1
      .getMutationCache()
      .build(client1, { mutationKey: OFFLINE_MUTATION_KEYS.toggleHabit })
      .execute({
        habit,
        userId: 'u1',
        date: '2026-08-05',
      })
    await new Promise((r) => setTimeout(r, 10))

    const dehydrated = dehydrate(client1, { shouldDehydrateMutation })
    expect(dehydrated.mutations).toHaveLength(1)

    const client2 = new QueryClient()
    registerOfflineMutations(client2)
    hydrate(client2, dehydrated)

    onlineManager.setOnline(true)
    await client2.resumePausedMutations()

    expect(setHabitCount).toHaveBeenCalledWith({
      userId: 'u1',
      habitId: 'h1',
      date: '2026-08-05',
      count: 1,
    })
    expect(client2.getMutationCache().getAll()[0]?.state.status).toBe('success')
  })

  it('resumes a freeze toggle (branching mutationFn) after reconnect', async () => {
    onlineManager.setOnline(false)
    const client = new QueryClient()
    registerOfflineMutations(client)
    const mutation = client
      .getMutationCache()
      .build(client, { mutationKey: OFFLINE_MUTATION_KEYS.toggleFreeze })
    const pending = mutation.execute({
      userId: 'u1',
      habitId: 'h1',
      date: '2026-08-05',
      freeze: true,
    })
    await new Promise((r) => setTimeout(r, 10))

    onlineManager.setOnline(true)
    await client.resumePausedMutations()
    await pending

    expect(addFreeze).toHaveBeenCalledWith('u1', 'h1', '2026-08-05')
  })

  it('resumes habit creation and returns the created row', async () => {
    onlineManager.setOnline(false)
    const client = new QueryClient()
    registerOfflineMutations(client)
    const mutation = client
      .getMutationCache()
      .build(client, { mutationKey: OFFLINE_MUTATION_KEYS.createHabit })
    const pending = mutation.execute({
      userId: 'u1',
      input: { name: 'Read', frequency: 'daily', target_count: 1, time_of_day: null },
    })
    await new Promise((r) => setTimeout(r, 10))

    onlineManager.setOnline(true)
    await client.resumePausedMutations()
    const result = await pending

    expect(createHabit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Read', user_id: 'u1' }),
    )
    expect(result).toEqual({ id: 'new-habit', frequency: 'daily' })
  })

  it('resumes a shared toggleWorkoutComplete write from either call site', async () => {
    onlineManager.setOnline(false)
    const client = new QueryClient()
    registerOfflineMutations(client)
    const mutation = client
      .getMutationCache()
      .build(client, { mutationKey: OFFLINE_MUTATION_KEYS.toggleWorkoutComplete })
    const pending = mutation.execute({ id: 'w1', userId: 'u1', done: true })
    await new Promise((r) => setTimeout(r, 10))

    onlineManager.setOnline(true)
    await client.resumePausedMutations()
    await pending

    expect(updateWorkout).toHaveBeenCalledWith('w1', {
      completed_at: expect.any(String),
    })
  })

  it('a non-offline mutation key is never dehydrated, matching queryClient.ts', () => {
    const client = new QueryClient()
    const mutation = client
      .getMutationCache()
      .build(
        client,
        { mutationKey: ['settings', 'updateProfile'] },
        { ...client.getMutationCache().build(client, {}).state, isPaused: true },
      )
    expect(shouldDehydrateMutation(mutation)).toBe(false)
  })
})
