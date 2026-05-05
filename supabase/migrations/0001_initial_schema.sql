-- FitFlow initial schema
-- NOTE: The user did not provide a literal SQL payload, so this migration implements the requested production schema.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_date date not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  completion_percentage numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_date)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  muscle_group text not null default 'General',
  notes text,
  position integer not null default 0,
  is_complete boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  set_index integer not null,
  reps integer not null default 0,
  weight numeric(8,2) not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, set_index)
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_predefined boolean not null default false,
  template_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;
alter table public.workout_templates enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_workout_sessions_updated_at before update on public.workout_sessions for each row execute procedure public.set_updated_at();
create trigger set_workouts_updated_at before update on public.workouts for each row execute procedure public.set_updated_at();
create trigger set_workout_sets_updated_at before update on public.workout_sets for each row execute procedure public.set_updated_at();
create trigger set_workout_templates_updated_at before update on public.workout_templates for each row execute procedure public.set_updated_at();

create policy "Profiles are readable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles are updatable by owner" on public.profiles for update using (auth.uid() = id);

create policy "Workout sessions are readable by owner" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "Workout sessions are insertable by owner" on public.workout_sessions for insert with check (auth.uid() = user_id);
create policy "Workout sessions are updatable by owner" on public.workout_sessions for update using (auth.uid() = user_id);
create policy "Workout sessions are deletable by owner" on public.workout_sessions for delete using (auth.uid() = user_id);

create policy "Workouts are readable by owner" on public.workouts for select using (auth.uid() = user_id);
create policy "Workouts are insertable by owner" on public.workouts for insert with check (auth.uid() = user_id);
create policy "Workouts are updatable by owner" on public.workouts for update using (auth.uid() = user_id);
create policy "Workouts are deletable by owner" on public.workouts for delete using (auth.uid() = user_id);

create policy "Workout sets are readable by owner" on public.workout_sets for select using (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
);
create policy "Workout sets are insertable by owner" on public.workout_sets for insert with check (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
);
create policy "Workout sets are updatable by owner" on public.workout_sets for update using (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
);
create policy "Workout sets are deletable by owner" on public.workout_sets for delete using (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
);

create policy "Templates are readable by owner or predefined" on public.workout_templates for select using (
  is_predefined = true or auth.uid() = user_id
);
create policy "Templates are insertable by owner" on public.workout_templates for insert with check (
  auth.uid() = user_id and is_predefined = false
);
create policy "Templates are updatable by owner" on public.workout_templates for update using (
  auth.uid() = user_id and is_predefined = false
);
create policy "Templates are deletable by owner" on public.workout_templates for delete using (
  auth.uid() = user_id and is_predefined = false
);

insert into public.workout_templates (name, description, is_predefined, template_data)
select * from (
  values
    ('Push Day', 'Chest, shoulders, and triceps', true, '[{"exerciseName":"Bench Press","sets":[{"reps":8,"weight":100},{"reps":8,"weight":100},{"reps":6,"weight":105}]},{"exerciseName":"Overhead Press","sets":[{"reps":8,"weight":65},{"reps":8,"weight":65},{"reps":6,"weight":70}]},{"exerciseName":"Triceps Pushdown","sets":[{"reps":12,"weight":45},{"reps":12,"weight":45},{"reps":10,"weight":50}]}]'::jsonb),
    ('Pull Day', 'Back, biceps, and rear delts', true, '[{"exerciseName":"Pull Up","sets":[{"reps":8,"weight":0},{"reps":8,"weight":0},{"reps":6,"weight":0}]},{"exerciseName":"Barbell Row","sets":[{"reps":10,"weight":95},{"reps":10,"weight":95},{"reps":8,"weight":100}]},{"exerciseName":"Hammer Curl","sets":[{"reps":12,"weight":25},{"reps":12,"weight":25},{"reps":10,"weight":30}]}]'::jsonb),
    ('Lower Body', 'Squat-focused training day', true, '[{"exerciseName":"Back Squat","sets":[{"reps":8,"weight":135},{"reps":8,"weight":155},{"reps":6,"weight":175}]},{"exerciseName":"Romanian Deadlift","sets":[{"reps":10,"weight":135},{"reps":10,"weight":145},{"reps":8,"weight":155}]},{"exerciseName":"Walking Lunge","sets":[{"reps":12,"weight":20},{"reps":12,"weight":20},{"reps":10,"weight":25}]}]'::jsonb)
) as seeded(name, description, is_predefined, template_data)
where not exists (select 1 from public.workout_templates where is_predefined = true);
