import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  userEmail: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar userEmail={userEmail} />
      <div className={cn('flex min-h-screen flex-1 flex-col') }>
        <Topbar email={userEmail} />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
