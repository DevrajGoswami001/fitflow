import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters')
});

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name').max(80)
});

export const setSchema = z.object({
  reps: z.coerce.number().int().min(1).max(100),
  weight: z.coerce.number().min(0).max(2000),
  completed: z.boolean().default(false)
});

export const workoutSchema = z.object({
  exerciseName: z.string().min(2, 'Enter an exercise name').max(80),
  muscleGroup: z.string().min(2).max(40),
  notes: z.string().max(280).optional().or(z.literal('')),
  sets: z.array(setSchema).min(1, 'Add at least one set')
});

export const templateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(160).optional().or(z.literal('')),
  templateData: z.array(workoutSchema).min(1)
});

export type AuthValues = z.infer<typeof authSchema>;
export type WorkoutValues = z.infer<typeof workoutSchema>;
export type TemplateValues = z.infer<typeof templateSchema>;
