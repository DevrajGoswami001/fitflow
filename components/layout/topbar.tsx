'use client';

import { Menu, Dumbbell } from 'lucide-react';
import { Button } from '@/components/shared/button';

interface TopbarProps {
  email?: string | null;
  onOpen?: () => void;
}

export function Topbar({ email, onOpen }: TopbarProps) {
  return (
    <header className="w-full flex items-center justify-between border-b border-white/8 bg-background/70 px-4 sm:px-6 md:px-8 py-4 backdrop-blur md:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Dumbbell className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">FitFlow</div>
          <div className="text-xs text-muted-foreground truncate">{email ?? 'Training dashboard'}</div>
        </div>
      </div>
      <div className="shrink-0">
        <Button variant="ghost" size="sm" aria-label="Open navigation" className="shrink-0" onClick={onOpen}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
