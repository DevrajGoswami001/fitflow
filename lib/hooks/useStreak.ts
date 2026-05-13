"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { calculateStreak } from "@/lib/utils/dates"
import { toast } from "sonner"

interface StreakData {
  currentStreak: number
  longestStreak: number
  isAtRisk: boolean
  lastWorkoutDate: string | null
}

export function useStreak(userId: string | undefined) {
  const supabase = createClient()
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    isAtRisk: false,
    lastWorkoutDate: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    async function fetchStreak() {
      try {
        setIsLoading(true)

        const { data, error } = await supabase
          .from("workout_sessions")
          .select("date")
          .eq("user_id", userId)
          .gt("completed_exercises", 0)
          .order("date", { ascending: false })

        if (error) throw error

        const dates = (data || []).map((d) => d.date)
        const streakData = calculateStreak(dates)

        setStreak({
          currentStreak: streakData.current,
          longestStreak: streakData.longest,
          isAtRisk: streakData.isAtRisk,
          lastWorkoutDate: dates[0] || null,
        })

        if (streakData.isAtRisk) {
          toast.warning("Streak at risk! Complete a workout today to keep it going.")
        }
      } catch (err) {
        console.error("Failed to fetch streak:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreak()
  }, [userId, supabase])

  return {
    ...streak,
    isLoading,
  }
}
