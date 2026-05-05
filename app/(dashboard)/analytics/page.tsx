import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { getAnalyticsSnapshot } from '@/lib/queries';

export default async function AnalyticsPage() {
  const snapshot = await getAnalyticsSnapshot();
  if (!snapshot) redirect('/login');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Measure what matters"
        description="See weekly streak momentum and completion rate in a single view."
      />
      <AnalyticsDashboard snapshot={snapshot} />
    </div>
  );
}