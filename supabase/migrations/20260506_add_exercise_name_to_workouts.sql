alter table public.workouts
add column if not exists exercise_name text;

update public.workouts
set exercise_name = coalesce(exercise_name, exercise)
where exercise_name is null and exercise is not null;
