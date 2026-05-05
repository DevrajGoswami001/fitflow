'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Filter, History, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useInfiniteScroll } from '@/lib/hooks/use-infinite-scroll';
import type { HistorySnapshot, SessionSnapshot, WorkoutSnapshot } from '@/lib/queries';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/shared/input';
import { Badge } from '@/components/shared/badge';
import { Button } from '@/components/shared/button';
import { formatWeight } from '@/lib/utils';

interface HistoryBoardProps {
  userId: string;
  initialSnapshot: HistorySnapshot;
}

export function HistoryBoard({ userId, initialSnapshot }: HistoryBoardProps) {
  const supabase = createClient();
  const [sessions, setSessions] = useState<SessionSnapshot[]>(initialSnapshot.sessions);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialSnapshot.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      console.debug('HistoryBoard.fetchHistory: start');
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (workoutsError) {
        console.error('HistoryBoard.fetchHistory: error fetching workouts', workoutsError);
        setSessions([]);
        setHasMore(false);
        return;
      }

      console.debug('HistoryBoard.fetchHistory: fetched workouts', workouts);

      if (!workouts || workouts.length === 0) {
        console.debug('HistoryBoard.fetchHistory: query returned no completed rows');
        setSessions([]);
        setHasMore(false);
        return;
      }

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('*')
        .in('workout_id', (workouts ?? []).map((workout: any) => workout.id))
        .order('set_index', { ascending: true });

      const workoutsBySession = new Map<string, WorkoutSnapshot[]>();
      for (const workout of workouts ?? []) {
        const workoutSets = (sets ?? [])
          .filter((set) => set.workout_id === workout.id)
          .map((set) => ({
            id: set.id,
            setIndex: set.set_index,
            reps: set.reps,
            weight: Number(set.weight),
            completed: set.completed
          }));

        const normalized: WorkoutSnapshot = {
          id: workout.id,
          exerciseName: workout.exercise_name,
          muscleGroup: workout.muscle_group,
          notes: workout.notes,
          position: workout.position,
          isComplete: workout.completed,
          completedAt: workout.completed_at,
          createdAt: workout.created_at,
          sets: workoutSets
        };

        const completedDate = workout.completed_at ? workout.completed_at.slice(0, 10) : workout.created_at.slice(0, 10);
        const list = workoutsBySession.get(completedDate) ?? [];
        workoutsBySession.set(completedDate, [...list, normalized]);
      }

      const sortedSessions = Array.from(workoutsBySession.entries())
        .map(([workoutDate, groupedWorkouts]) => ({
          id: workoutDate,
          workoutDate,
          startedAt: groupedWorkouts[0]?.createdAt ?? new Date().toISOString(),
          completedAt: groupedWorkouts[0]?.completedAt ?? null,
          completionPercentage: 100,
          notes: null,
          workouts: groupedWorkouts
        }))
        .sort((a, b) => {
          const aDate = a.workouts[0]?.completedAt ?? '';
          const bDate = b.workouts[0]?.completedAt ?? '';
          if (aDate === bDate) return 0;
          return aDate > bDate ? -1 : 1;
        });

      console.debug('HistoryBoard.fetchHistory: built sessions', sortedSessions);
      setSessions(sortedSessions);
      setPage(1);
      setHasMore(false);
      console.debug('HistoryBoard.fetchHistory: state updated with', sortedSessions.length, 'grouped day buckets');
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const from = page * 8;
      const to = from + 7;
      const { data: nextSessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .range(from, to);

      if (!nextSessions || nextSessions.length === 0) {
        setHasMore(false);
        return;
      }

      const sessionIds = nextSessions.map((session) => session.id);
      // Only fetch completed workouts and sort by completed_at desc so history shows finished exercises
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .in('session_id', sessionIds)
        .eq('completed', true)
        .order('completed_at', { ascending: false });
      const { data: sets } = await supabase.from('workout_sets').select('*').in('workout_id', (workouts ?? []).map((workout) => workout.id)).order('set_index', { ascending: true });

      const workoutsBySession = new Map<string, WorkoutSnapshot[]>();
      for (const workout of workouts ?? []) {
        const workoutSets = (sets ?? [])
          .filter((set) => set.workout_id === workout.id)
          .map((set) => ({
            id: set.id,
            setIndex: set.set_index,
            reps: set.reps,
            weight: Number(set.weight),
            completed: set.completed
          }));
        const normalized: WorkoutSnapshot = {
          id: workout.id,
          exerciseName: workout.exercise_name,
          muscleGroup: workout.muscle_group,
          notes: workout.notes,
          position: workout.position,
          isComplete: workout.is_complete,
          completedAt: workout.completed_at,
          createdAt: workout.created_at,
          sets: workoutSets
        };
        const list = workoutsBySession.get(workout.session_id) ?? [];
        workoutsBySession.set(workout.session_id, [...list, normalized]);
      }

      const appended = nextSessions.map((session) => ({
        id: session.id,
        workoutDate: session.workout_date,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        completionPercentage: Number(session.completion_percentage),
        notes: session.notes,
        workouts: workoutsBySession.get(session.id) ?? []
      }));

      setSessions((current) => [...current, ...appended]);
      setPage((current) => current + 1);
      setHasMore(nextSessions.length === 8);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, supabase, userId]);

  useEffect(() => {
    console.debug('HistoryBoard: initialSnapshot', { total: initialSnapshot.totalCount, sessions: initialSnapshot.sessions.length });
    void fetchHistory();
  }, [fetchHistory, initialSnapshot]);

  const sentinelRef = useInfiniteScroll(loadMore, !hasMore);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (dateFilter && session.workoutDate !== dateFilter) return false;
      if (!exerciseFilter) return true;
      return session.workouts.some((workout) => workout.exerciseName.toLowerCase().includes(exerciseFilter.toLowerCase()));
    });
  }, [dateFilter, exerciseFilter, sessions]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Workout history</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:w-[520px]">
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
            <Input placeholder="Search exercise" value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDateFilter('');
              setExerciseFilter('');
            }}
          >
            Reset filters
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="p-6 text-sm text-muted-foreground">Loading history...</div>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          title="No workouts in last 7 days"
          description=""
          action={<Button variant="outline">Reset filters</Button>}
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{format(parseISO(session.workoutDate), 'EEEE, MMM d')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Completion {session.completionPercentage}%</p>
                </div>
                <Badge>{session.workouts.length} exercises</Badge>
              </div>
              <div className="space-y-3">
                {session.workouts.map((workout) => (
                  <div key={workout.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-base font-medium text-foreground">{workout.exerciseName}</div>
                        <div className="text-sm text-muted-foreground">{workout.muscleGroup}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{workout.isComplete ? 'Completed' : 'In progress'}</div>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      {workout.sets.map((set) => (
                        <div key={set.id} className="rounded-2xl border border-white/6 bg-black/20 px-3 py-2 text-sm text-muted-foreground">
                          Set {set.setIndex + 1}: {set.reps} reps @ {formatWeight(set.weight)} {set.completed ? '• done' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        {loadingMore ? <ChevronDown className="mr-2 h-4 w-4 animate-bounce" /> : null}
        {hasMore ? 'Scroll to load more' : 'No more workouts to load'}
      </div>
    </div>
  );
}
