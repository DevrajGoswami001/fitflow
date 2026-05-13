"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useWorkouts } from "@/lib/hooks/useWorkouts"
import { useStreak } from "@/lib/hooks/useStreak"
import { getTodayDate, formatWorkoutDate } from "@/lib/utils/dates"
import { groupWorkoutsByCompletion } from "@/lib/utils/workout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyWorkoutState } from "@/components/workout/EmptyWorkoutState"
import { Plus, Flame } from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const today = getTodayDate()
  const { workouts, isLoading: workoutsLoading, addWorkout } = useWorkouts(today)
  const [userId, setUserId] = useState<string>()
  const [userFullName, setUserFullName] = useState("")
  const { currentStreak } = useStreak(userId)

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
        if (profile?.full_name) {
          setUserFullName(profile.full_name)
        }
      }
    }
    getUser()
  }, [supabase])

  const { active, completed } = groupWorkoutsByCompletion(workouts)
  const completionRate =
    workouts.length > 0
      ? Math.round((completed.length / workouts.length) * 100)
      : 0

  const handleAddExercise = () => {
    toast.info("Exercise drawer opened")
  }

  const handleLoadTemplate = () => {
    router.push("/templates")
  }

  if (workoutsLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Good morning, {userFullName || "Champion"} 👋
        </h1>
        <p className="text-muted-foreground">{formatWorkoutDate(today)}</p>
      </div>

      {/* Streak Card */}
      {currentStreak > 0 && (
        <Card className="mb-8 p-4 border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-orange-400" />
            <div>
              <p className="font-semibold">{currentStreak} day streak! 🔥</p>
              <p className="text-sm text-muted-foreground">Keep the momentum going</p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Bar */}
      {workouts.length > 0 && (
        <Card className="mb-8 p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Today's Progress</span>
            <span className="text-muted-foreground">
              {completed.length}/{workouts.length}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {completionRate}% complete
          </p>
        </Card>
      )}

      {/* Workouts or Empty State */}
      {workouts.length === 0 ? (
        <EmptyWorkoutState
          onAddExercise={handleAddExercise}
          onLoadTemplate={handleLoadTemplate}
        />
      ) : (
        <div className="space-y-6">
          {/* Active workouts */}
          {active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">In Progress</h2>
              <div className="space-y-3">
                {active.map((workout) => (
                  <Card key={workout.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{workout.exercise_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workout.sets} sets × {workout.reps || "∞"} reps
                          {workout.weight_kg && ` · ${workout.weight_kg} kg`}
                        </p>
                      </div>
                      <Button size="sm">Mark Complete</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed workouts */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-green-400">
                Completed ({completed.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {completed.map((workout) => (
                  <Card key={workout.id} className="p-3 bg-surface-3/50">
                    <p className="text-sm line-through">{workout.exercise_name}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button
          onClick={handleAddExercise}
          className="h-14 w-14 rounded-full gradient-primary shadow-xl"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
