"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database"
import {
  calculateAverageSetsPerWorkout,
  getMostTrainedMuscleGroup,
  calculateWorkoutsThisMonth,
  getWeeklyWorkoutCounts,
} from "@/lib/utils/workout"
import { subDays, format } from "date-fns"

type Workout = Database["public"]["Tables"]["workouts"]["Row"]

export interface AnalyticsData {
  dailyCounts: Array<{ date: string; count: number }>
  completionRate: number
  averageSetsPerWorkout: number
  mostTrainedMuscleGroup: { group: string; count: number } | null
  totalWorkoutsThisMonth: number
  weeklyData: Record<string, number>
}

export function useAnalytics(userId: string | undefined, range: "7d" | "30d" = "7d") {
  const supabase = createClient()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyCounts: [],
    completionRate: 0,
    averageSetsPerWorkout: 0,
    mostTrainedMuscleGroup: null,
    totalWorkoutsThisMonth: 0,
    weeklyData: {},
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    async function fetchAnalytics() {
      try {
        setIsLoading(true)

        const daysBack = range === "7d" ? 7 : 30
        const startDate = format(subDays(new Date(), daysBack), "yyyy-MM-dd")

        const { data, error } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate)
          .order("date", { ascending: true })

        if (error) throw error

        const workouts = (data || []) as Workout[]

        // Calculate daily completion counts
        const dailyMap: Record<string, number> = {}
        workouts.forEach((w) => {
          if (w.completed) {
            if (!dailyMap[w.date]) {
              dailyMap[w.date] = 0
            }
            dailyMap[w.date]++
          }
        })

        const dailyCounts = Object.entries(dailyMap)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))

        // Calculate completion rate
        const completionRate = workouts.length > 0
          ? Math.round((workouts.filter((w) => w.completed).length / workouts.length) * 100)
          : 0

        // Get other metrics
        const completedWorkouts = workouts.filter((w) => w.completed)
        const averageSetsPerWorkout = calculateAverageSetsPerWorkout(completedWorkouts)
        const mostTrainedMuscleGroup = getMostTrainedMuscleGroup(completedWorkouts)
        const totalWorkoutsThisMonth = calculateWorkoutsThisMonth(completedWorkouts)
        const weeklyData = getWeeklyWorkoutCounts(completedWorkouts)

        setAnalytics({
          dailyCounts,
          completionRate,
          averageSetsPerWorkout,
          mostTrainedMuscleGroup,
          totalWorkoutsThisMonth,
          weeklyData,
        })
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [userId, supabase, range])

  return { ...analytics, isLoading }
}
