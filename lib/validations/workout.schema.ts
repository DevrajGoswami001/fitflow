import { z } from "zod"

export const workoutSchema = z.object({
  exercise_name: z.string().min(1, "Exercise name is required").max(100),
  sets: z.number().int().min(1).max(20).default(3),
  reps: z.number().int().min(1).max(100).optional().nullable(),
  weight_kg: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type WorkoutInput = z.infer<typeof workoutSchema>

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type SignupInput = z.infer<typeof signupSchema>

export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
})

export type TemplateInput = z.infer<typeof templateSchema>

export const sessionSchema = z.object({
  mood: z.enum(["great", "good", "okay", "tired"]).optional(),
  duration_minutes: z.number().int().min(1).optional(),
})

export type SessionInput = z.infer<typeof sessionSchema>
