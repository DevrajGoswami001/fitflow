import { create } from 'zustand';
import type { Json } from '@/types/database';

export type WorkoutSet = {
  id: string;
  setIndex: number;
  reps: number;
  weight: number;
  completed: boolean;
};

export type WorkoutItem = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  notes?: string | null;
  isComplete: boolean;
  position: number;
  sets: WorkoutSet[];
  createdAt: string;
};

export type WorkoutTemplateItem = {
  exerciseName: string;
  muscleGroup: string;
  notes?: string;
  sets: Array<{ reps: number; weight: number; completed?: boolean }>;
};

type WorkoutState = {
  activeDate: string;
  workouts: WorkoutItem[];
  templates: Array<{ id: string; name: string; description: string | null; isPredefined: boolean; templateData: Json }>;
  loading: boolean;
  setActiveDate: (date: string) => void;
  hydrate: (payload: Partial<WorkoutState>) => void;
  addWorkout: (workout: WorkoutItem) => void;
  updateWorkout: (workoutId: string, patch: Partial<WorkoutItem>) => void;
  removeWorkout: (workoutId: string) => void;
  markSetComplete: (workoutId: string, setId: string, completed: boolean) => void;
  setTemplates: (templates: WorkoutState['templates']) => void;
};

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeDate: new Date().toISOString().slice(0, 10),
  workouts: [],
  templates: [],
  loading: true,
  setActiveDate: (date) => set({ activeDate: date }),
  hydrate: (payload) => set((state) => ({ ...state, ...payload, loading: false })),
  addWorkout: (workout) => set((state) => ({ workouts: [workout, ...state.workouts] })),
  updateWorkout: (workoutId, patch) => set((state) => ({ workouts: state.workouts.map((item) => (item.id === workoutId ? { ...item, ...patch } : item)) })),
  removeWorkout: (workoutId) => set((state) => ({ workouts: state.workouts.filter((item) => item.id !== workoutId) })),
  markSetComplete: (workoutId, setId, completed) => set((state) => ({
    workouts: state.workouts.map((item) => {
      if (item.id !== workoutId) return item;
      const sets = item.sets.map((setItem) => (setItem.id === setId ? { ...setItem, completed } : setItem));
      const isComplete = sets.length > 0 && sets.every((setItem) => setItem.completed);
      return { ...item, sets, isComplete };
    })
  })),
  setTemplates: (templates) => set({ templates })
}));
