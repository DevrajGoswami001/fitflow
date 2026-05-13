import { Database } from "@/types/database"

export type Workout = Database["public"]["Tables"]["workouts"]["Row"]
export type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"]
export type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"]

export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function groupWorkoutsByCompletion(workouts: Workout[]): {
  active: Workout[]
  completed: Workout[]
} {
  return {
    active: workouts.filter((w) => !w.completed),
    completed: workouts.filter((w) => w.completed),
  }
}

export function formatSetTrackerDisplay(sets: number): string[] {
  return Array.from({ length: sets }, (_, i) => `Set ${i + 1}`)
}

export interface ExercisePreview {
  name: string
  sets: number
  reps?: number | null
}

export function parseTemplateExercises(exercises: unknown): ExercisePreview[] {
  if (!Array.isArray(exercises)) return []
  return exercises.map((e) => ({
    name: typeof e === "object" && e !== null && "name" in e ? String(e.name) : "",
    sets: typeof e === "object" && e !== null && "sets" in e ? Number(e.sets) : 0,
    reps: typeof e === "object" && e !== null && "reps" in e ? e.reps : null,
  }))
}

export function calculateAverageSetsPerWorkout(workouts: Workout[]): number {
  if (workouts.length === 0) return 0
  const totalSets = workouts.reduce((sum, w) => sum + (w.sets || 0), 0)
  return Math.round(totalSets / workouts.length * 10) / 10
}

export function getMostTrainedMuscleGroup(
  workouts: Workout[]
): { group: string; count: number } | null {
  if (workouts.length === 0) return null

  const muscleGroups: Record<string, number> = {
    chest: 0,
    back: 0,
    legs: 0,
    shoulders: 0,
    arms: 0,
    core: 0,
    cardio: 0,
  }

  const keywords: Record<string, string[]> = {
    chest: ["bench", "press", "flye", "pec"],
    back: ["row", "pull", "pulldown", "deadlift"],
    legs: ["squat", "leg", "lunge", "calf"],
    shoulders: ["shoulder", "lateral", "overhead"],
    arms: ["bicep", "curl", "tricep", "dip"],
    core: ["crunch", "plank", "ab"],
    cardio: ["jump", "rope", "run", "bike", "climb"],
  }

  workouts.forEach((workout) => {
    const name = workout.exercise_name.toLowerCase()
    for (const [group, groupKeywords] of Object.entries(keywords)) {
      if (groupKeywords.some((kw) => name.includes(kw))) {
        muscleGroups[group]++
        break
      }
    }
  })

  const entries = Object.entries(muscleGroups)
  const [group, count] = entries.reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  )

  return count > 0 ? { group: capitalize(group), count } : null
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function calculateWorkoutsThisMonth(workouts: Workout[]): number {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  return workouts.filter((w) => {
    const workoutDate = new Date(w.date)
    return workoutDate >= monthStart
  }).length
}

export function getWeeklyWorkoutCounts(workouts: Workout[]): Record<string, number> {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const counts: Record<string, number> = {}

  days.forEach((day) => {
    counts[day] = 0
  })

  workouts.forEach((w) => {
    const date = new Date(w.date)
    const dayIndex = (date.getDay() + 6) % 7
    const dayName = days[dayIndex]
    counts[dayName]++
  })

  return counts
}
