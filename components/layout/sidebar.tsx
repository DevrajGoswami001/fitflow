'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarRange, Dumbbell, LayoutGrid, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/shared/button';
import { cn } from '@/lib/utils';

const navigation: Array<{ href: Route; label: string; icon: typeof LayoutGrid }> = [
  { href: '/home', label: 'Today', icon: LayoutGrid },
  { href: '/history', label: 'History', icon: CalendarRange },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 }
];

interface SidebarProps {
  userEmail: string | null;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userEmail, isMobile = false, onClose, open = false }: SidebarProps & { open?: boolean }) {
  const pathname = usePathname();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const mobileBase = 'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-white/8 bg-white/[0.02] px-4 py-6 transform transition-transform duration-300 ease-in-out';
  const desktopBase = 'hidden md:flex min-h-screen w-72 flex-col border-r border-white/8 bg-white/[0.02] px-4 py-6';

  const rootClass = isMobile
    ? `${mobileBase} ${open ? 'translate-x-0' : '-translate-x-full'}`
    : desktopBase;

  return (
    <aside className={rootClass} aria-hidden={isMobile ? !open : undefined}>
      {isMobile ? (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-glow">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-foreground">FitFlow</div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Premium training OS</div>
            </div>
          </div>
          <div>
            <Button variant="ghost" onClick={onClose} aria-label="Close navigation">✕</Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-glow">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-foreground">FitFlow</div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Premium training OS</div>
          </div>
        </div>
      )}

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors min-w-0',
                active ? 'bg-primary/15 text-foreground shadow-glow' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
                onClick={() => {
                  if (isMobile && onClose) onClose();
                }}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-8">
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 min-w-0">
          <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Signed in as</div>
          <div className="mt-2 break-words text-sm font-medium text-foreground truncate">{userEmail ?? 'Member'}</div>
        </div>
        <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
