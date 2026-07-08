import { create } from 'zustand'

interface UiState {
  /** Habit form sheet: null = closed, 'new' = create, or a habit id to edit. */
  habitForm: 'new' | string | null
  openNewHabit: () => void
  openEditHabit: (habitId: string) => void
  closeHabitForm: () => void
}

export const useUiStore = create<UiState>((set) => ({
  habitForm: null,
  openNewHabit: () => set({ habitForm: 'new' }),
  openEditHabit: (habitId) => set({ habitForm: habitId }),
  closeHabitForm: () => set({ habitForm: null }),
}))
