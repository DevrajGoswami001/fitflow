"use client";
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface DashboardShellProps {
  userEmail: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
    return;
  }, [mobileOpen]);

  // close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // close on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar (visible on md and up) */}
      <Sidebar userEmail={userEmail} />

      {/* Mobile overlay + drawer (mounted always to enable transitions) */}
      <div className={cn('fixed inset-0 z-40 md:hidden transition-opacity duration-300', mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')} aria-hidden={!mobileOpen}>
        <div className={cn('absolute inset-0 bg-black/50 backdrop-blur-sm', mobileOpen ? 'opacity-100' : 'opacity-0')} onClick={() => setMobileOpen(false)} />
        <div className="relative h-full">
          <Sidebar userEmail={userEmail} isMobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className={cn('flex min-h-screen flex-1 flex-col min-w-0')}>
        <Topbar email={userEmail} onOpen={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 lg:py-8 min-w-0 w-full max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
