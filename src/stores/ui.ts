import { create } from 'zustand'

/** What the Create sheet shows: the grid of things to make, or the quick habit form. */
export type CreateView = 'menu' | 'habit'

interface UiState {
  /** Habit edit sheet: the habit id being edited, or null when closed. */
  habitForm: string | null
  openEditHabit: (habitId: string) => void
  closeHabitForm: () => void
  /** The Create sheet ("+"): null when closed. */
  create: CreateView | null
  openCreate: (view?: CreateView) => void
  closeCreate: () => void
  /** Straight to the quick habit form — "New habit" buttons across the app. */
  openNewHabit: () => void
  /** The sync capsule is on screen — phone toasts stack above it instead of under it. */
  syncCapsuleVisible: boolean
  setSyncCapsuleVisible: (visible: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  habitForm: null,
  openEditHabit: (habitId) => set({ habitForm: habitId }),
  closeHabitForm: () => set({ habitForm: null }),
  create: null,
  openCreate: (view = 'menu') => set({ create: view }),
  closeCreate: () => set({ create: null }),
  openNewHabit: () => set({ create: 'habit' }),
  syncCapsuleVisible: false,
  setSyncCapsuleVisible: (visible) => set({ syncCapsuleVisible: visible }),
}))
