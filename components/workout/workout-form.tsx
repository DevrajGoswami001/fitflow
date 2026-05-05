'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Textarea } from '@/components/shared/textarea';
import { Card } from '@/components/shared/card';
import { createClient } from '@/lib/supabase/client';

// ✅ SIMPLE SCHEMA (NO sets[])
const workoutDraftSchema = z.object({
  exerciseName: z.string().min(2, 'Enter an exercise name').max(80),
  muscleGroup: z.string().min(2, 'Enter a muscle group').max(40),
  notes: z.string().max(280).optional().or(z.literal('')),
  setCount: z.coerce.number().int().min(1).max(8),
  reps: z.coerce.number().int().min(1).max(100),
  weight: z.coerce.number().min(0).max(2000)
});

type WorkoutDraftValues = z.infer<typeof workoutDraftSchema>;

interface WorkoutFormProps {
  onSubmit?: (values: any) => Promise<void>;
  onSuccess?: (workout: any) => void;
}

export function WorkoutForm({ onSubmit, onSuccess }: WorkoutFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ✅ FIXED defaultValues (match schema)
  const defaultValues = useMemo<WorkoutDraftValues>(
    () => ({
      exerciseName: '',
      muscleGroup: 'General',
      notes: '',
      setCount: 3,
      reps: 8,
      weight: 0
    }),
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<WorkoutDraftValues>({
    resolver: zodResolver(workoutDraftSchema),
    defaultValues
  });

  async function submit(values: WorkoutDraftValues) {
    console.log('🔵 FORM SUBMITTED WITH VALUES:', values);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const supabase = createClient();

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Auth error: ${userError.message}`);
      }

      if (!userData?.user) {
        throw new Error('User not logged in');
      }

      const user = userData.user;
      console.log('✅ User authenticated:', user.id);

      // ✅ MATCH YOUR TABLE STRUCTURE
      const payload = {
        user_id: user.id,
        exercise: values.exerciseName,
        muscle_group: values.muscleGroup,
        sets: values.setCount,
        reps: values.reps,
        weight: values.weight,
        notes: values.notes
      };

      console.log('📤 Inserting payload:', payload);

      // @ts-ignore
      const { data, error } = await supabase.from('workouts').insert([payload]).select();

      if (error) {
        throw new Error(`Insert failed: ${error.message}`);
      }

      console.log('✅ Workout added successfully:', data);
      setSubmitSuccess(true);
      reset(defaultValues);

      if (data && data.length > 0 && onSuccess) {
        onSuccess(data[0]);
      }

      // Clear success message after 2 seconds
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      console.error('❌ Error:', msg);
      setSubmitError(msg);
    }
  }

  return (
    <Card>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit(submit)}
      >
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">
            Exercise
          </label>
          <Input
            placeholder="Incline Dumbbell Press"
            {...register('exerciseName')}
          />
          {errors.exerciseName && (
            <p className="text-xs text-red-400">
              {errors.exerciseName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Muscle Group
          </label>
          <Input
            placeholder="Chest"
            {...register('muscleGroup')}
          />
          {errors.muscleGroup && (
            <p className="text-xs text-red-400">
              {errors.muscleGroup.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Sets
          </label>
          <Input
            type="number"
            min={1}
            max={8}
            {...register('setCount')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Reps
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            {...register('reps')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Weight
          </label>
          <Input
            type="number"
            min={0}
            max={2000}
            step="0.5"
            {...register('weight')}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">
            Notes
          </label>
          <Textarea
            placeholder="Tempo, cues, or reminders"
            {...register('notes')}
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          {submitError && (
            <div className="w-full text-sm text-red-400 bg-red-950 p-2 rounded">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="w-full text-sm text-green-400 bg-green-950 p-2 rounded">
              ✅ Workout added successfully!
            </div>
          )}
          <Button type="submit" disabled={isSubmitting}>
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Adding...' : 'Add exercise'}
          </Button>
        </div>
      </form>
    </Card>
  );
}