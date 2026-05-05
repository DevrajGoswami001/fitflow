import { createServerSupabaseClient } from '@/lib/supabase/server';
import { calculateCompletion, calculateStreak, getWeeklyStreak } from '@/lib/utils';
import type { Database, Json } from '@/types/database';

export type WorkoutSetSnapshot = {
  id: string;
  setIndex: number;
  reps: number;
  weight: number;
  completed: boolean;
};

export type WorkoutSnapshot = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  notes: string | null;
  position: number;
  isComplete: boolean;
  completedAt: string | null;
  createdAt: string;
  sets: WorkoutSetSnapshot[];
};

export type SessionSnapshot = {
  id: string;
  workoutDate: string;
  startedAt: string;
  completedAt: string | null;
  completionPercentage: number;
  notes: string | null;
  workouts: WorkoutSnapshot[];
};

export type TemplateSnapshot = {
  id: string;
  name: string;
  description: string | null;
  isPredefined: boolean;
  templateData: Json;
};

export type DashboardSnapshot = {
  userId: string;
  userEmail: string | null;
  fullName: string;
  streak: number;
  activeCount: number;
  completedCount: number;
  completionPercentage: number;
  session: SessionSnapshot | null;
  recentSessions: SessionSnapshot[];
  templates: TemplateSnapshot[];
};

export type SimpleWorkout = {
  id: string;
  user_id: string;
  exercise: string;
  muscle_group: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string | null;
  completed: boolean;
  created_at: string;
};

export type HistorySnapshot = {
  sessions: SessionSnapshot[];
  totalCount: number;
  hasMore: boolean;
};

export type AnalyticsSnapshot = {
  streak: number;
  completionPercentage: number;
  weeklySeries: Array<{ date: string; streak: number }>;
  totalWorkouts: number;
  completedWorkouts: number;
  averageSetsPerWorkout: number;
};

function normalizeSet(row: Database['public']['Tables']['workout_sets']['Row']): WorkoutSetSnapshot {
  return {
    id: row.id,
    setIndex: row.set_index,
    reps: row.reps,
    weight: Number(row.weight),
    completed: row.completed
  };
}

function normalizeWorkout(
  row: Database['public']['Tables']['workouts']['Row'],
  sets: WorkoutSetSnapshot[]
): WorkoutSnapshot {
  return {
    id: row.id,
    exerciseName: row.exercise_name,
    muscleGroup: row.muscle_group,
    notes: row.notes,
    position: row.position,
    isComplete: (row as any).completed ?? row.is_complete,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    sets
  };
}

async function fetchWorkoutsWithSets(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  sessionIds: string[],
  options?: { completedOnly?: boolean }
): Promise<Map<string, WorkoutSnapshot[]>> {
  if (sessionIds.length === 0) return new Map();

  let query = supabase.from('workouts').select('*').in('session_id', sessionIds);
  if (options?.completedOnly) {
    query = query.eq('completed', true).order('completed_at', { ascending: false });
  } else {
    query = query.order('position', { ascending: true });
  }

  const { data: workouts } = await query;

  const workoutRows = workouts ?? [];
  const workoutIds = workoutRows.map((row) => row.id);
  const { data: setRows } = await supabase.from('workout_sets').select('*').in('workout_id', workoutIds).order('set_index', { ascending: true });

  const setsByWorkoutId = new Map<string, WorkoutSetSnapshot[]>();
  for (const setRow of setRows ?? []) {
    const set = normalizeSet(setRow);
    const existing = setsByWorkoutId.get(setRow.workout_id) ?? [];
    setsByWorkoutId.set(setRow.workout_id, [...existing, set]);
  }

  const workoutsBySessionId = new Map<string, WorkoutSnapshot[]>();
  for (const row of workoutRows) {
    const workout = normalizeWorkout(row, setsByWorkoutId.get(row.id) ?? []);
    const existing = workoutsBySessionId.get(row.session_id) ?? [];
    workoutsBySessionId.set(row.session_id, [...existing, workout]);
  }

  return workoutsBySessionId;
}

async function buildSessions(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  sessions: Database['public']['Tables']['workout_sessions']['Row'][]
  , options?: { completedOnly?: boolean }
): Promise<SessionSnapshot[]> {
  const workoutsBySession = await fetchWorkoutsWithSets(
    supabase,
    sessions.map((session) => session.id)
    , options
  );

  return sessions.map((session) => ({
    id: session.id,
    workoutDate: session.workout_date,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    completionPercentage: Number(session.completion_percentage),
    notes: session.notes,
    workouts: workoutsBySession.get(session.id) ?? []
  }));
}

export async function getWorkouts(): Promise<SimpleWorkout[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString().slice(0, 10);

  // fetch only workouts created today (UTC boundary) and that are not completed
  const { data, error } = await supabase
    .from('workouts')
    .select('id, user_id, exercise_name, muscle_group, notes, completed, created_at')
    .eq('user_id', user.id)
    .eq('completed', false)
    .gte('created_at', `${isoToday}T00:00:00Z`)
    .lt('created_at', `${isoTomorrow}T00:00:00Z`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workouts:', error);
    return [];
  }

  return (data ?? []).map((workout) => ({
    id: workout.id,
    user_id: workout.user_id,
    exercise: workout.exercise_name,
    muscle_group: workout.muscle_group,
    sets: 0,
    reps: 0,
    weight: 0,
    notes: workout.notes,
    completed: workout.completed,
    created_at: workout.created_at
  }));
}

export async function markWorkoutComplete(workoutId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('workouts')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', workoutId);

  if (error) {
    throw new Error(`Failed to mark workout complete: ${error.message}`);
  }
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [profileResult, sessionResult, recentSessionsResult, templatesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('workout_sessions').select('*').eq('user_id', user.id).eq('workout_date', today).maybeSingle(),
    supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .limit(60),
    supabase
      .from('workout_templates')
      .select('*')
      .or(`is_predefined.eq.true,user_id.eq.${user.id}`)
      .order('is_predefined', { ascending: false })
      .order('created_at', { ascending: false })
  ]);

  const recentSessions = await buildSessions(supabase, recentSessionsResult.data ?? []);
  const session = sessionResult.data ? (await buildSessions(supabase, [sessionResult.data]))[0] : null;
  // Prefer workout creation dates for streak calculation (uses created_at)
  const start = new Date();
  start.setDate(start.getDate() - 59); // look back 60 days
  const rangeStart = start.toISOString().slice(0, 10);

  const { data: workoutRows } = await supabase
    .from('workouts')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', `${rangeStart}T00:00:00Z`);

  const dates = (workoutRows ?? []).map((w: any) => (w.created_at ? (w.created_at as string).slice(0, 10) : '')).filter(Boolean);

  const activeCount = session?.workouts.filter((workout) => !workout.isComplete).length ?? 0;
  const completedCount = session?.workouts.filter((workout) => workout.isComplete).length ?? 0;
  const completionPercentage = session?.completionPercentage ?? 0;
  const fullName = profileResult.data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Athlete';

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    fullName,
    streak: calculateStreak(dates),
    activeCount,
    completedCount,
    completionPercentage,
    session,
    recentSessions,
    templates: (templatesResult.data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      isPredefined: template.is_predefined,
      templateData: template.template_data
    }))
  };
}

export async function getHistorySnapshot(page = 0, pageSize = 8): Promise<HistorySnapshot | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Fetch completed workouts with no date filter so completed history always appears
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .range(from, to);

  if (workoutsError) {
    console.error('getHistorySnapshot: error fetching workouts', workoutsError);
    return { sessions: [], totalCount: 0, hasMore: false };
  }

  const workoutsRows = workoutsData ?? [];
  console.debug(`getHistorySnapshot: fetched ${workoutsRows.length} completed workouts`, workoutsRows);

  const sessionIds = Array.from(new Set((workoutsRows as any[]).map((w) => w.session_id))).filter(Boolean);
  if (sessionIds.length === 0) {
    return { sessions: [], totalCount: 0, hasMore: false };
  }

  const { data: sessionsRows, error: sessionsError } = await supabase.from('workout_sessions').select('*').in('id', sessionIds as string[]);
  if (sessionsError) {
    console.error('getHistorySnapshot: error fetching sessions', sessionsError);
    return { sessions: [], totalCount: 0, hasMore: false };
  }

  let sessions = await buildSessions(supabase, sessionsRows ?? [], { completedOnly: true });

  // Sort sessions by latest completed_at among their workouts (desc)
  const latestCompletedBySession = new Map<string, string>();
  for (const w of workoutsRows as any[]) {
    const sid = w.session_id;
    const completedAt = w.completed_at as string | null;
    if (!completedAt) continue;
    const existing = latestCompletedBySession.get(sid);
    if (!existing || completedAt > existing) latestCompletedBySession.set(sid, completedAt);
  }

  sessions.sort((a, b) => {
    const aDate = latestCompletedBySession.get(a.id) ?? '';
    const bDate = latestCompletedBySession.get(b.id) ?? '';
    if (aDate === bDate) return 0;
    return aDate > bDate ? -1 : 1;
  });

  console.debug(`getHistorySnapshot: built ${sessions.length} sessions`, sessions);

  const totalCount = sessions.length;
  const hasMore = (workoutsRows.length ?? 0) === pageSize;

  return { sessions, totalCount, hasMore };
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString().slice(0, 10);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartIso = `${weekStart.toISOString().slice(0, 10)}T00:00:00Z`;

  const [completedResult, todayResult] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, completed, completed_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .not('completed_at', 'is', null)
      .gte('completed_at', weekStartIso)
      .order('completed_at', { ascending: false }),
    supabase
      .from('workouts')
      .select('id, completed, created_at')
      .eq('user_id', user.id)
      .gte('created_at', `${isoToday}T00:00:00Z`)
      .lt('created_at', `${isoTomorrow}T00:00:00Z`)
  ]);

  const completedWorkoutsRows = completedResult.data ?? [];
  const todayRows = todayResult.data ?? [];

  console.debug('getAnalyticsSnapshot: raw completed workouts', completedWorkoutsRows);
  console.debug('getAnalyticsSnapshot: raw today workouts', todayRows);

  // Streak uses completed_at dates only and breaks on missed days.
  const completedDates = completedWorkoutsRows
    .map((row: any) => (row.completed_at ? String(row.completed_at).slice(0, 10) : ''))
    .filter(Boolean);

  const weeklySeries = getWeeklyStreak(
    completedWorkoutsRows.map((row: any) => ({
      completed_at: row.completed_at
    }))
  );

  console.debug('getAnalyticsSnapshot: processed weekly data', weeklySeries);

  const completedToday = todayRows.filter((row: any) => Boolean(row.completed)).length;
  const totalToday = todayRows.length;
  const completionPercentage = calculateCompletion(completedToday, totalToday);

  const totalWorkouts = totalToday;
  const completedWorkouts = completedToday;
  const averageSetsPerWorkout =
    completedWorkoutsRows.length === 0
      ? 0
      : completedWorkoutsRows.reduce((sum: number, row: any) => sum + Number(row.sets ?? 0), 0) /
        completedWorkoutsRows.length;

  return {
    streak: calculateStreak(completedDates),
    completionPercentage,
    weeklySeries,
    totalWorkouts,
    completedWorkouts,
    averageSetsPerWorkout: Number(averageSetsPerWorkout.toFixed(1))
  };
}

export async function getTemplatesSnapshot(): Promise<TemplateSnapshot[] | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('workout_templates')
    .select('*')
    .or(`is_predefined.eq.true,user_id.eq.${user.id}`)
    .order('is_predefined', { ascending: false })
    .order('created_at', { ascending: false });

  return (data ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    isPredefined: template.is_predefined,
    templateData: template.template_data
  }));
}
