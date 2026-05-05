'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarRange, Dumbbell, LayoutGrid, LogOut, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/shared/button';
import { cn } from '@/lib/utils';

const navigation: Array<{ href: Route; label: string; icon: typeof LayoutGrid }> = [
  { href: '/home', label: 'Today', icon: LayoutGrid },
  { href: '/history', label: 'History', icon: CalendarRange },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: Sparkles }
];

interface SidebarProps {
  userEmail: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <aside className="hidden min-h-screen w-72 flex-col border-r border-white/8 bg-white/[0.02] px-5 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-glow">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight text-foreground">FitFlow</div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Premium training OS</div>
        </div>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors',
                active ? 'bg-primary/15 text-foreground shadow-glow' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-8">
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Signed in as</div>
          <div className="mt-2 break-all text-sm font-medium text-foreground">{userEmail ?? 'Member'}</div>
        </div>
        <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
