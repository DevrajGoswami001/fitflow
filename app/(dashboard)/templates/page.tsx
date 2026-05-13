"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Database } from "@/types/database"
import { parseTemplateExercises } from "@/lib/utils/workout"
import { toast } from "sonner"

type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"]

export default function TemplatesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data, error } = await supabase
          .from("workout_templates")
          .select("*")
          .or(`is_predefined.eq.true,user_id.eq.${user.id}`)
          .order("is_predefined", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) throw error
        setTemplates(data || [])
      } catch (err) {
        console.error("Failed to fetch templates:", err)
        toast.error("Failed to load templates")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [supabase])

  const handleLoadTemplate = async (template: WorkoutTemplate) => {
    try {
      if (!userId) return

      const exercises = parseTemplateExercises(template.exercises)
      const today = new Date().toISOString().split("T")[0]

      // Insert exercises for today
      const newWorkouts = exercises.map((ex) => ({
        user_id: userId,
        exercise_name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || null,
        weight_kg: null,
        notes: null,
        completed: false,
        completed_at: null,
        date: today,
      }))

      const { error } = await supabase.from("workouts").insert(newWorkouts)

      if (error) throw error

      toast.success(`${template.name} loaded! 🎯`)
    } catch (err) {
      toast.error("Failed to load template")
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workout Templates</h1>
        <p className="text-muted-foreground">
          Choose from pre-built templates or create your own
        </p>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No templates available</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const exercises = parseTemplateExercises(template.exercises)

            return (
              <Card key={template.id} className="p-6 flex flex-col">
                <div className="mb-4 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    {template.is_predefined && (
                      <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">
                        Official
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {exercises.slice(0, 4).map((ex, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.sets} sets × {ex.reps || "∞"} reps
                        </p>
                      </div>
                    ))}
                    {exercises.length > 4 && (
                      <p className="text-xs text-muted-foreground pt-2">
                        +{exercises.length - 4} more...
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleLoadTemplate(template)}
                  className="w-full gradient-primary"
                  size="sm"
                >
                  Load to Today
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
