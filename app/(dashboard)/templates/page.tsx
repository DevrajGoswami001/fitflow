import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TemplateLibrary } from '@/components/templates/template-library';
import { getDashboardSnapshot } from '@/lib/queries';

export default async function TemplatesPage() {
  const snapshot = await getDashboardSnapshot();
  if (!snapshot) redirect('/login');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Templates"
        title="Reuse what works"
        description="Load built-in programs, save your current workout as a template, and keep training friction low."
      />
      <TemplateLibrary
        userId={snapshot.userId}
        templates={snapshot.templates}
        currentWorkouts={snapshot.session?.workouts.map((workout) => ({
          exerciseName: workout.exerciseName,
          muscleGroup: workout.muscleGroup,
          notes: workout.notes ?? undefined,
          sets: workout.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            completed: set.completed
          }))
        })) ?? []}
      />
    </div>
  );
}