"use client"

import { useEffect, useState, useCallback } from "react"
import { useWorkoutStore } from "@/lib/store/workoutStore"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database"
import { workoutSchema } from "@/lib/validations/workout.schema"
import { toast } from "sonner"

type Workout = Database["public"]["Tables"]["workouts"]["Row"]
type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"]
type WorkoutInput = Omit<WorkoutInsert, "id" | "created_at">

export function useWorkouts(date: string) {
  const supabase = createClient()
  const {
    workouts,
    isLoading,
    error,
    setWorkouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    setIsLoading,
    setError,
  } = useWorkoutStore()

  const fetchWorkouts = useCallback(async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("Not authenticated")
        return
      }

      const { data, error: err } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .order("created_at", { ascending: true })

      if (err) throw err
      setWorkouts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch workouts"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [date, supabase, setWorkouts, setIsLoading, setError])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const addWorkoutLocal = useCallback(
    async (input: Omit<WorkoutInput, "user_id">) => {
      try {
        const validated = workoutSchema.parse(input)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        const newWorkout: WorkoutInput = {
          ...validated,
          user_id: user.id,
          date,
          completed: false,
        }

        const { data, error: err } = await supabase
          .from("workouts")
          .insert([newWorkout])
          .select()
          .single()

        if (err) throw err
        addWorkout(data)
        toast.success(`${data.exercise_name} added!`)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add workout"
        setError(message)
        toast.error(message)
      }
    },
    [supabase, date, addWorkout, setError]
  )

  const completeWorkout = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase
          .from("workouts")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("id", id)

        if (err) throw err

        const workout = workouts.find((w) => w.id === id)
        if (workout) {
          updateWorkout(id, { completed: true, completed_at: new Date().toISOString() })
          toast.success(`${workout.exercise_name} completed! 🔥`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to complete workout"
        setError(message)
        toast.error(message)
      }
    },
    [supabase, workouts, updateWorkout, setError]
  )

  const deleteWorkoutLocal = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase.from("workouts").delete().eq("id", id)

        if (err) throw err

        const workout = workouts.find((w) => w.id === id)
        deleteWorkout(id)
        if (workout) {
          toast.success(`${workout.exercise_name} deleted`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete workout"
        setError(message)
        toast.error(message)
      }
    },
    [supabase, workouts, deleteWorkout, setError]
  )

  const editWorkout = useCallback(
    async (id: string, updates: Partial<Omit<WorkoutInput, "user_id">>) => {
      try {
        const { error: err } = await supabase
          .from("workouts")
          .update(updates)
          .eq("id", id)

        if (err) throw err

        updateWorkout(id, updates)
        toast.success("Workout updated")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update workout"
        setError(message)
        toast.error(message)
      }
    },
    [supabase, updateWorkout, setError]
  )

  return {
    workouts: workouts.filter((w) => w.date === date),
    isLoading,
    error,
    addWorkout: addWorkoutLocal,
    completeWorkout,
    deleteWorkout: deleteWorkoutLocal,
    editWorkout,
    refetch: fetchWorkouts,
  }
}
