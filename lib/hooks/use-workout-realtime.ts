'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkoutStore } from '@/lib/store/workout-store';
import type { Database } from '@/types/database';

type WorkoutRow = Database['public']['Tables']['workouts']['Row'];

export function useWorkoutRealtime(userId: string | null) {
  const supabase = createClient();
  const updateWorkout = useWorkoutStore((state) => state.updateWorkout);
  const addWorkout = useWorkoutStore((state) => state.addWorkout);
  const removeWorkout = useWorkoutStore((state) => state.removeWorkout);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`workouts-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `user_id=eq.${userId}` }, (payload) => {
        const row = payload.new as WorkoutRow | null;
        if (payload.eventType === 'DELETE') {
          const deleted = payload.old as WorkoutRow;
          removeWorkout(deleted.id);
          return;
        }
        if (!row) return;
        const existing = useWorkoutStore.getState().workouts.find((workout) => workout.id === row.id);
        const mapped = {
          id: row.id,
          exerciseName: row.exercise_name,
          muscleGroup: row.muscle_group,
          notes: row.notes,
          isComplete: (row as any).completed ?? row.is_complete,
          position: row.position,
          sets: existing?.sets ?? [],
          createdAt: row.created_at
        };
        if (payload.eventType === 'INSERT') {
          if (existing) {
            updateWorkout(row.id, mapped);
          } else {
            if (mapped.isComplete) {
              // completed items should not be in today's store
              removeWorkout(row.id);
            } else {
              addWorkout(mapped);
            }
          }
        } else {
          if (mapped.isComplete) {
            removeWorkout(row.id);
          } else {
            updateWorkout(row.id, mapped);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addWorkout, removeWorkout, supabase, updateWorkout, userId]);
}
