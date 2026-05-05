import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { getHistorySnapshot } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { HistoryBoard } from '@/components/history/history-board';

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const snapshot = await getHistorySnapshot();
  if (!snapshot) redirect('/login');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="History"
        title="Review every session"
        description="Browse previous workouts, filter by exercise, and follow your progress session by session."
      />
      <HistoryBoard userId={user.id} initialSnapshot={snapshot} />
    </div>
  );
}