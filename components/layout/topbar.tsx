'use client';

import { Menu, Dumbbell } from 'lucide-react';
import { Button } from '@/components/shared/button';

interface TopbarProps {
  email?: string | null;
}

export function Topbar({ email }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/8 bg-background/70 px-4 py-4 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Dumbbell className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">FitFlow</div>
          <div className="text-xs text-muted-foreground">{email ?? 'Training dashboard'}</div>
        </div>
      </div>
      <Button variant="ghost" size="sm" aria-label="Open navigation">
        <Menu className="h-4 w-4" />
      </Button>
    </header>
  );
}
