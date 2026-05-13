"use client"

import { Dumbbell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyWorkoutStateProps {
  onAddExercise: () => void
  onLoadTemplate: () => void
}

export function EmptyWorkoutState({
  onAddExercise,
  onLoadTemplate,
}: EmptyWorkoutStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-surface-2 flex items-center justify-center mb-6">
        <Dumbbell className="h-8 w-8 text-muted" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Start your fitness journey by adding an exercise or loading a pre-built template.
      </p>
      <div className="flex gap-3 flex-col sm:flex-row">
        <Button onClick={onAddExercise} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
        <Button onClick={onLoadTemplate} variant="outline">
          Load Template
        </Button>
      </div>
    </div>
  )
}
