# FitFlow

FitFlow is a premium workout tracking SaaS built with Next.js 14, Supabase, Tailwind CSS, Zustand, Framer Motion, React Hook Form, Zod, and Recharts.

## Features

- Email/password and Google authentication
- Protected dashboard routes
- Today's workout tracker with per-set completion
- Workout history with filters and pagination
- Templates library with predefined and user-created templates
- Analytics dashboard with streaks, completion rate, and weekly volume charts
- Realtime syncing through Supabase subscriptions
- Dark-first, glassmorphism UI with responsive layouts

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase values.
2. Install dependencies with `npm install`.
3. Apply the schema in `supabase/migrations/0001_initial_schema.sql` to your Supabase database.
4. Run `npm run dev`.

## Supabase Configuration

Create a Supabase project and set these values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Enable Google auth in Supabase if you want third-party login.

## Database

The SQL migration defines:

- `profiles`
- `workout_sessions`
- `workouts`
- `workout_templates`
- `workout_sets`
- RLS policies
- Auto profile creation trigger
- Predefined templates

## Deployment

- Push the repository to GitHub.
- Add the environment variables in Vercel.
- Set the Supabase site URL and redirect URLs to your Vercel domain.
- Deploy the Next.js app.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
