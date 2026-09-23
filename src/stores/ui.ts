import { create } from 'zustand'

interface UiState {
  /** Habit form sheet: null = closed, 'new' = create, or a habit id to edit. */
  habitForm: 'new' | string | null
  openNewHabit: () => void
  openEditHabit: (habitId: string) => void
  closeHabitForm: () => void
  /** The sync capsule is on screen — phone toasts stack above it instead of under it. */
  syncCapsuleVisible: boolean
  setSyncCapsuleVisible: (visible: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  habitForm: null,
  openNewHabit: () => set({ habitForm: 'new' }),
  openEditHabit: (habitId) => set({ habitForm: habitId }),
  closeHabitForm: () => set({ habitForm: null }),
  syncCapsuleVisible: false,
  setSyncCapsuleVisible: (visible) => set({ syncCapsuleVisible: visible }),
}))
