import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/types/database';
import type { WorkoutTemplateItem } from '@/lib/store/workout-store';

export type WorkoutSetDraft = {
  id?: string;
  reps: number;
  weight: number;
  completed: boolean;
};

export type WorkoutDraft = {
  exerciseName: string;
  muscleGroup: string;
  notes?: string;
  sets: WorkoutSetDraft[];
};

export async function ensureTodaySession(
  supabase: SupabaseClient<Database>,
  userId: string,
  workoutDate: string
) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .upsert(
      {
        user_id: userId,
        workout_date: workoutDate
      },
      { onConflict: 'user_id,workout_date' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkout(
  supabase: SupabaseClient<Database>,
  params: {
    sessionId: string;
    userId: string;
    workoutId?: string;
    draft: WorkoutDraft;
    position: number;
  }
) {
  const workoutId = params.workoutId ?? uuidv4();
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      id: workoutId,
      session_id: params.sessionId,
      user_id: params.userId,
      exercise_name: params.draft.exerciseName,
      muscle_group: params.draft.muscleGroup,
      notes: params.draft.notes ?? null,
      position: params.position
    })
    .select('*')
    .single();

  if (workoutError) throw workoutError;

  const setPayload = params.draft.sets.map((set, index) => ({
    id: set.id ?? uuidv4(),
    workout_id: workout.id,
    set_index: index,
    reps: set.reps,
    weight: set.weight,
    completed: set.completed
  }));

  const { error: setError } = await supabase.from('workout_sets').insert(setPayload);
  if (setError) throw setError;

  return {
    ...workout,
    sets: setPayload
  };
}

export async function updateWorkout(
  supabase: SupabaseClient<Database>,
  params: {
    workoutId: string;
    draft: WorkoutDraft;
  }
) {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .update({
      exercise_name: params.draft.exerciseName,
      muscle_group: params.draft.muscleGroup,
      notes: params.draft.notes ?? null
    })
    .eq('id', params.workoutId)
    .select('*')
    .single();

  if (workoutError) throw workoutError;

  const { error: deleteError } = await supabase.from('workout_sets').delete().eq('workout_id', params.workoutId);
  if (deleteError) throw deleteError;

  const setPayload = params.draft.sets.map((set, index) => ({
    id: set.id ?? uuidv4(),
    workout_id: params.workoutId,
    set_index: index,
    reps: set.reps,
    weight: set.weight,
    completed: set.completed
  }));

  const { error: setError } = await supabase.from('workout_sets').insert(setPayload);
  if (setError) throw setError;

  return {
    ...workout,
    sets: setPayload
  };
}

export async function deleteWorkoutById(supabase: SupabaseClient<Database>, workoutId: string) {
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
  if (error) throw error;
}

export async function toggleWorkoutSetComplete(
  supabase: SupabaseClient<Database>,
  params: {
    setId: string;
    workoutId: string;
    completed: boolean;
  }
) {
  const { error } = await supabase
    .from('workout_sets')
    .update({
      completed: params.completed,
      completed_at: params.completed ? new Date().toISOString() : null
    })
    .eq('id', params.setId);

  if (error) throw error;

  const { data: sets, error: setsError } = await supabase.from('workout_sets').select('*').eq('workout_id', params.workoutId);
  if (setsError) throw setsError;

  const isComplete = (sets ?? []).length > 0 && (sets ?? []).every((set) => set.completed);
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .update({
      is_complete: isComplete,
      completed: isComplete,
      completed_at: isComplete ? new Date().toISOString() : null
    })
    .eq('id', params.workoutId)
    .select('*')
    .single();

  if (workoutError) throw workoutError;

  return workout;
}

export async function loadTemplateIntoSession(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    sessionId: string;
    templateData: WorkoutTemplateItem[];
    startPosition: number;
  }
) {
  const workouts = [] as Array<{ id: string; exercise_name: string; muscle_group: string; notes: string | null; position: number; created_at: string; sets: Array<{ id: string; set_index: number; reps: number; weight: number; completed: boolean }> }>;
  for (let index = 0; index < params.templateData.length; index += 1) {
    const exercise = params.templateData[index];
    const workoutId = uuidv4();
    const setPayload = exercise.sets.map((set, setIndex) => ({
      id: uuidv4(),
      workout_id: workoutId,
      set_index: setIndex,
      reps: set.reps,
      weight: set.weight,
      completed: Boolean(set.completed)
    }));
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        id: workoutId,
        session_id: params.sessionId,
        user_id: params.userId,
        exercise_name: exercise.exerciseName,
        muscle_group: exercise.muscleGroup,
        notes: exercise.notes ?? null,
        position: params.startPosition + index
      })
      .select('*')
      .single();
    if (error) throw error;

    const { error: setError } = await supabase.from('workout_sets').insert(setPayload);
    if (setError) throw setError;

    workouts.push({
      id: workout.id,
      exercise_name: workout.exercise_name,
      muscle_group: workout.muscle_group,
      notes: workout.notes,
      position: workout.position,
      created_at: workout.created_at,
      sets: setPayload.map((set) => ({
        id: set.id,
        set_index: set.set_index,
        reps: set.reps,
        weight: set.weight,
        completed: set.completed
      }))
    });
  }

  return workouts;
}

export async function saveTemplate(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    name: string;
    description?: string;
    templateData: WorkoutTemplateItem[];
  }
) {
  const { error } = await supabase.from('workout_templates').insert({
    id: uuidv4(),
    user_id: params.userId,
    name: params.name,
    description: params.description ?? null,
    is_predefined: false,
    template_data: params.templateData
  });

  if (error) throw error;
}
