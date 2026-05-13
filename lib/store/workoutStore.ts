import { create } from "zustand"
import { Database } from "@/types/database"

type Workout = Database["public"]["Tables"]["workouts"]["Row"]

interface WorkoutStoreState {
  workouts: Workout[]
  selectedDate: string
  isLoading: boolean
  error: string | null
  setWorkouts: (workouts: Workout[]) => void
  addWorkout: (workout: Workout) => void
  updateWorkout: (id: string, updates: Partial<Workout>) => void
  deleteWorkout: (id: string) => void
  setSelectedDate: (date: string) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useWorkoutStore = create<WorkoutStoreState>((set) => ({
  workouts: [],
  selectedDate: new Date().toISOString().split("T")[0],
  isLoading: false,
  error: null,
  setWorkouts: (workouts) => set({ workouts }),
  addWorkout: (workout) =>
    set((state) => ({ workouts: [...state.workouts, workout] })),
  updateWorkout: (id, updates) =>
    set((state) => ({
      workouts: state.workouts.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),
  deleteWorkout: (id) =>
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== id),
    })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

interface UIState {
  isSidebarOpen: boolean
  isDarkMode: boolean
  showAddExerciseDrawer: boolean
  setSidebarOpen: (isOpen: boolean) => void
  setDarkMode: (isDarkMode: boolean) => void
  setShowAddExerciseDrawer: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isDarkMode: true,
  showAddExerciseDrawer: false,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setDarkMode: (isDarkMode) => set({ isDarkMode }),
  setShowAddExerciseDrawer: (show) => set({ showAddExerciseDrawer: show }),
}))
