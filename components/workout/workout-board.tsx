'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Flame, RefreshCcw, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutForm } from '@/components/workout/workout-form';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/shared/button';
import { Skeleton } from '@/components/shared/skeleton';
import { useWorkoutStore, type WorkoutItem } from '@/lib/store/workout-store';
import type { DashboardSnapshot, SimpleWorkout } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import {
  ensureTodaySession,
  createWorkout,
  deleteWorkoutById,
  toggleWorkoutSetComplete,
  updateWorkout
} from '@/lib/workout-actions';
import { useWorkoutRealtime } from '@/lib/hooks/use-workout-realtime';
import { WorkoutValues } from '@/lib/validations';
import { calculateStreak, cn } from '@/lib/utils';
import { motion as motion2 } from 'framer-motion';

interface WorkoutBoardProps {
  snapshot: DashboardSnapshot;
  workouts?: SimpleWorkout[];
}

function mapWorkoutRowToSimpleWorkout(workout: any): SimpleWorkout {
  return {
    id: workout.id,
    user_id: workout.user_id,
    exercise: workout.exercise ?? workout.exercise_name ?? workout.exerciseName,
    muscle_group: workout.muscle_group ?? workout.muscleGroup,
    sets: workout.sets ?? 0,
    reps: workout.reps ?? 0,
    weight: workout.weight ?? 0,
    notes: workout.notes ?? null,
    completed: workout.completed ?? false,
    created_at: workout.created_at ?? workout.createdAt ?? new Date().toISOString()
  };
}

export function WorkoutBoard({ snapshot, workouts: initialWorkouts = [] }: WorkoutBoardProps) {
  const supabase = createClient();
  const [sessionId, setSessionId] = useState<string | null>(snapshot.session?.id ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [isStreakLoading, setIsStreakLoading] = useState(true);
  const [workouts, setWorkouts] = useState<SimpleWorkout[]>(() =>
    initialWorkouts.map(mapWorkoutRowToSimpleWorkout)
  );
  const [completedCount, setCompletedCount] = useState<number>(snapshot.completedCount ?? 0);

  const workoutStoreItems = useWorkoutStore((state) => state.workouts);
  const activeDate = useWorkoutStore((state) => state.activeDate);
  const hydrate = useWorkoutStore((state) => state.hydrate);
  const addWorkout = useWorkoutStore((state) => state.addWorkout);
  const updateWorkoutState = useWorkoutStore((state) => state.updateWorkout);
  const removeWorkout = useWorkoutStore((state) => state.removeWorkout);
  const markSetComplete = useWorkoutStore((state) => state.markSetComplete);

  useEffect(() => {
    setWorkouts(initialWorkouts.map(mapWorkoutRowToSimpleWorkout));
  }, [initialWorkouts]);

  useEffect(() => {
    hydrate({
      activeDate: snapshot.session?.workoutDate ?? new Date().toISOString().slice(0, 10),
      workouts:
        (snapshot.session?.workouts ?? [])
          .filter((row) => !row.isComplete)
          .map((row) => ({
            id: row.id,
            exerciseName: row.exerciseName,
            muscleGroup: row.muscleGroup,
            notes: row.notes,
            isComplete: row.isComplete,
            position: row.position,
            sets: row.sets.map((s: any) => ({
              id: s.id,
              setIndex: s.setIndex,
              reps: s.reps,
              weight: s.weight,
              completed: s.completed
            })),
            createdAt: row.createdAt
          })) ?? [],
    });
  }, [hydrate, snapshot.session]);

  useEffect(() => {
    let isMounted = true;

    async function fetchStreakForUser(userId: string) {
      setIsStreakLoading(true);

      const { data, error } = await supabase
        .from('workouts')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error('fetchStreakForUser: failed to load streak', error);
        setStreak(null);
        setIsStreakLoading(false);
        return;
      }

      const completedDates = (data ?? [])
        .map((row) => row.created_at)
        .filter((value): value is string => Boolean(value));

      setStreak(calculateStreak(completedDates));
      setIsStreakLoading(false);
    }

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;

      if (!user) {
        setStreak(null);
        setIsStreakLoading(false);
        return;
      }

      void fetchStreakForUser(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setStreak(null);
        setIsStreakLoading(false);
        return;
      }

      void fetchStreakForUser(session.user.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useWorkoutRealtime(snapshot.userId);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const session: any = await ensureTodaySession(supabase, snapshot.userId, activeDate);
    if (session) {
      setSessionId(session.id ?? null);
      return session.id ?? sessionId;
    }
    throw new Error('Failed to create session');
  }

  async function addExercise(values: WorkoutValues) {
    const workoutDate = activeDate;
    const nextSessionId = await ensureSession();
    const workoutId = crypto.randomUUID();
    const tempSetIds = values.sets.map(() => crypto.randomUUID());

    const optimisticStore: WorkoutItem = {
      id: workoutId,
      exerciseName: values.exerciseName,
      muscleGroup: values.muscleGroup,
      notes: values.notes || null,
      isComplete: false,
      position: workoutStoreItems.length,
      createdAt: new Date().toISOString(),
      sets: values.sets.map((set, index) => ({
        id: tempSetIds[index] ?? `${workoutId}-set-${index}`,
        setIndex: index,
        reps: set.reps,
        weight: set.weight,
        completed: set.completed
      }))
    };

    const optimisticSimple: SimpleWorkout = {
      id: workoutId,
      user_id: snapshot.userId,
      exercise: values.exerciseName,
      muscle_group: values.muscleGroup,
      sets: values.sets.length,
      reps: values.sets[0]?.reps ?? 0,
      weight: values.sets[0]?.weight ?? 0,
      notes: values.notes ?? null,
      completed: false,
      created_at: new Date().toISOString()
    };

    addWorkout(optimisticStore);
    setWorkouts((prev) => [optimisticSimple, ...prev]);

    try {
      await createWorkout(supabase, {
        sessionId: nextSessionId,
        userId: snapshot.userId,
        workoutId,
        draft: {
          exerciseName: values.exerciseName,
          muscleGroup: values.muscleGroup,
          notes: values.notes || undefined,
          sets: values.sets.map((set, index) => ({
            id: tempSetIds[index],
            reps: set.reps,
            weight: set.weight,
            completed: set.completed
          }))
        },
        position: workoutStoreItems.length
      });
      toast.success(`Added ${values.exerciseName} for ${workoutDate}`);
    } catch (error) {
      removeWorkout(workoutId);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      toast.error(error instanceof Error ? error.message : 'Failed to add exercise');
    }
  }

  async function saveWorkout(itemId: string, patch: Partial<WorkoutItem>) {
    const item = workoutStoreItems.find((entry) => entry.id === itemId);
    if (!item) return;

    updateWorkoutState(itemId, patch);

    try {
      await updateWorkout(supabase, {
        workoutId: itemId,
        draft: {
          exerciseName: patch.exerciseName ?? item.exerciseName,
          muscleGroup: patch.muscleGroup ?? item.muscleGroup,
          notes: patch.notes ?? item.notes ?? undefined,
          sets: (patch.sets ?? item.sets).map((set: any) => ({
            id: set.id,
            reps: set.reps,
            weight: set.weight,
            completed: set.completed
          }))
        }
      });
      toast.success('Workout updated');
    } catch (error) {
      updateWorkoutState(itemId, item);
      toast.error(error instanceof Error ? error.message : 'Failed to update workout');
    }
  }

  async function deleteExercise(itemId: string) {
    const existing = workouts.find((w) => w.id === itemId);
    if (!existing) return;

    setWorkouts((prev) => prev.filter((w) => w.id !== itemId));

    try {
      await deleteWorkoutById(supabase, itemId);
      toast.success('Workout removed');
    } catch (error) {
      setWorkouts((prev) => [existing, ...prev]);
      toast.error(error instanceof Error ? error.message : 'Failed to delete workout');
    }
  }

  async function toggleSet(itemId: string, setId: string, completed: boolean) {
    const item = workouts.find((entry) => entry.id === itemId);
    if (!item) return;

    markSetComplete(itemId, setId, completed);

    try {
      await toggleWorkoutSetComplete(supabase, { setId, workoutId: itemId, completed });
      toast.success(completed ? 'Set completed' : 'Set reopened');
    } catch (error) {
      markSetComplete(itemId, setId, !completed);
      toast.error(error instanceof Error ? error.message : 'Failed to update set');
    }
  }

  async function markWorkoutDone(workoutId: string) {
    const existing = workouts.find((w) => w.id === workoutId);
    if (!existing) return;

    // Optimistically remove from today's UI (moves to History)
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    removeWorkout(workoutId);
    // Optimistically update completed count and completion percentage
    setCompletedCount((c) => c + 1);

    try {
      const res = await fetch('/api/workouts/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to mark workout complete');
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        void (async () => {
          const { data } = await supabase
            .from('workouts')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const completedDates = (data ?? [])
            .map((row) => row.created_at)
            .filter((value): value is string => Boolean(value));

          setStreak(calculateStreak(completedDates));
        })();
      });
      toast.success('Workout marked as done');
    } catch (error) {
      // revert completed count on failure
      setCompletedCount((c) => Math.max(0, c - 1));
      // Revert UI and store on failure
      addWorkout({
        id: existing.id,
        exerciseName: existing.exercise,
        muscleGroup: existing.muscle_group,
        notes: existing.notes ?? null,
        isComplete: false,
        position: workoutStoreItems.length,
        createdAt: existing.created_at,
        sets: []
      });
      setWorkouts((prev) => [existing, ...prev]);
      toast.error(error instanceof Error ? error.message : 'Failed to mark complete');
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleWorkoutAdded(newWorkout: any) {
    const workout = mapWorkoutRowToSimpleWorkout(newWorkout);
    setWorkouts((prev) =>
      prev.some((item) => item.id === workout.id)
        ? prev.map((item) => (item.id === workout.id ? workout : item))
        : [workout, ...prev]
    );
    toast.success('Workout added!');
  }

  const activeList = useMemo(() => workouts.filter((w) => !w.completed), [workouts]);
  const activeCount = activeList.length;
  const totalCount = activeCount + completedCount;
  const completionPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Activity</div>
              <div className="mt-2 text-3xl font-semibold text-foreground">
                {isStreakLoading || streak === null ? <Skeleton className="h-8 w-16" /> : streak}
              </div>
            </div>
            <Flame className="h-6 w-6 text-primary" />
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Active</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{activeCount}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Completed</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{completedCount}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Completion</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{completionPercentage}%</div>
        </Card>
      </div>

      <WorkoutForm onSubmit={addExercise} onSuccess={handleWorkoutAdded} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Today's workout</h2>
          <p className="text-sm text-muted-foreground">All completed exercises move into History automatically.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsRefreshing((value) => !value)}>
          <RefreshCcw className={cn('h-4 w-4', isRefreshing ? 'animate-spin' : '')} />
          Refresh view
        </Button>
      </div>

      <div className="space-y-4">
        {activeList.length > 0 ? (
          <AnimatePresence initial={false}>
            {activeList.map((workout) => (
              <motion2.div
                key={workout.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{workout.exercise}</h3>
                      <p className="text-sm text-muted-foreground">{workout.muscle_group}</p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span>
                          Sets: <span className="font-medium">{workout.sets}</span>
                        </span>
                        <span>
                          Reps: <span className="font-medium">{workout.reps}</span>
                        </span>
                        <span>
                          Weight: <span className="font-medium">{workout.weight}lbs</span>
                        </span>
                      </div>
                      {workout.notes && <p className="mt-2 text-xs text-muted-foreground italic">{workout.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => markWorkoutDone(workout.id)} className="gap-2">
                        <Check className="h-4 w-4" />
                        Done
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteExercise(workout.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion2.div>
            ))}
          </AnimatePresence>
        ) : (
          <EmptyState
            title="No active exercises yet"
            description="Create a movement, load a predefined template, or save your current session as a template to get started."
          />
        )}
      </div>

      
    </div>
  );
}