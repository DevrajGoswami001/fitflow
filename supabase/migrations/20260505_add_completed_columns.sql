-- Migration: Add completed and completed_at to workouts

alter table public.workouts
  add column if not exists completed boolean default false;

alter table public.workouts
  add column if not exists completed_at timestamp with time zone null;

-- Ensure existing columns are backfilled as false/null (no-op if columns existed)
update public.workouts set completed = false where completed is null;
update public.workouts set completed_at = null where completed_at is null;
