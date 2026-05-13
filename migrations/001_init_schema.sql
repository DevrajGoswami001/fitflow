-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (auto-created on signup)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  streak_count integer default 0,
  last_workout_date date,
  created_at timestamptz default now()
);

-- Workout templates (predefined + user-created)
create table workout_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  is_predefined boolean default false,
  exercises jsonb,
  created_at timestamptz default now()
);

-- Daily workouts (one row per exercise per day)
create table workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  exercise_name text not null,
  sets integer not null default 3,
  reps integer,
  weight_kg numeric,
  notes text,
  completed boolean default false,
  completed_at timestamptz,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Workout sessions (groups exercises by day)
create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  total_exercises integer default 0,
  completed_exercises integer default 0,
  duration_minutes integer,
  mood text check (mood in ('great','good','okay','tired')),
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Row Level Security
alter table profiles enable row level security;
alter table workouts enable row level security;
alter table workout_sessions enable row level security;
alter table workout_templates enable row level security;

create policy "Users manage own data" on workouts for all using (auth.uid() = user_id);
create policy "Users manage own sessions" on workout_sessions for all using (auth.uid() = user_id);
create policy "Users manage own profiles" on profiles for all using (auth.uid() = id);
create policy "Users see predefined or own templates" on workout_templates for select using (is_predefined = true or auth.uid() = user_id);
create policy "Users manage own templates" on workout_templates for insert with check (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Seed predefined templates
insert into workout_templates (name, is_predefined, exercises) values
  ('Chest Day', true, '[{"name":"Bench Press","sets":4,"reps":8},{"name":"Incline Dumbbell Press","sets":3,"reps":10},{"name":"Cable Flyes","sets":3,"reps":12},{"name":"Push-ups","sets":3,"reps":15}]'),
  ('Leg Day', true, '[{"name":"Barbell Squat","sets":4,"reps":8},{"name":"Romanian Deadlift","sets":3,"reps":10},{"name":"Leg Press","sets":3,"reps":12},{"name":"Calf Raises","sets":4,"reps":20}]'),
  ('Back & Biceps', true, '[{"name":"Pull-ups","sets":4,"reps":8},{"name":"Bent Over Row","sets":4,"reps":10},{"name":"Lat Pulldown","sets":3,"reps":12},{"name":"Barbell Curl","sets":3,"reps":12}]'),
  ('Shoulders & Triceps', true, '[{"name":"Overhead Press","sets":4,"reps":8},{"name":"Lateral Raises","sets":3,"reps":15},{"name":"Tricep Dips","sets":3,"reps":12},{"name":"Skull Crushers","sets":3,"reps":10}]'),
  ('Full Body', true, '[{"name":"Deadlift","sets":3,"reps":5},{"name":"Goblet Squat","sets":3,"reps":12},{"name":"Push-ups","sets":3,"reps":15},{"name":"Plank","sets":3,"reps":60}]'),
  ('Cardio & Core', true, '[{"name":"Jump Rope","sets":5,"reps":60},{"name":"Mountain Climbers","sets":4,"reps":30},{"name":"Bicycle Crunches","sets":3,"reps":20},{"name":"Burpees","sets":3,"reps":10}]');
