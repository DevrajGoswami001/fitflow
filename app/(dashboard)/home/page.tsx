import { PageHeader } from '@/components/shared/page-header';
import { WorkoutBoard } from '@/components/workout/workout-board';
import { getDashboardSnapshot, getWorkouts } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const [snapshot, workouts] = await Promise.all([
    getDashboardSnapshot(),
    getWorkouts()
  ]);

  if (!snapshot) redirect('/login');

  const totalCount = workouts.length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Today"
        title="Train with precision"
        description="Track sets, recoveries, and exercise completion in a dashboard built for serious daily use."
      />
      <WorkoutBoard snapshot={snapshot} workouts={workouts} />
    </div>
  );
}