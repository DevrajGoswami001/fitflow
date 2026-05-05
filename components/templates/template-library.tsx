'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { TemplateSnapshot } from '@/lib/queries';
import { Card } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { Input } from '@/components/shared/input';
import { Textarea } from '@/components/shared/textarea';
import { Badge } from '@/components/shared/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { saveTemplate, loadTemplateIntoSession, ensureTodaySession } from '@/lib/workout-actions';
import type { WorkoutTemplateItem } from '@/lib/store/workout-store';

interface TemplateLibraryProps {
  userId: string;
  templates: TemplateSnapshot[];
  currentWorkouts: WorkoutTemplateItem[];
}

export function TemplateLibrary({ userId, templates, currentWorkouts }: TemplateLibraryProps) {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? '');

  const predefined = useMemo(() => templates.filter((template) => template.isPredefined), [templates]);
  const custom = useMemo(() => templates.filter((template) => !template.isPredefined), [templates]);

  async function saveCurrent() {
    if (!name || currentWorkouts.length === 0) return;
    try {
      await saveTemplate(supabase, { userId, name, description, templateData: currentWorkouts });
      toast.success('Template saved');
      setName('');
      setDescription('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    }
  }

  async function loadSelected() {
    const template = templates.find((item) => item.id === selectedId);
    if (!template) return;
    try {
      const session = await ensureTodaySession(supabase, userId, new Date().toISOString().slice(0, 10));
      await loadTemplateIntoSession(supabase, {
        userId,
        sessionId: session.id,
        templateData: (template.templateData as unknown as WorkoutTemplateItem[]) ?? [],
        startPosition: 0
      });
      toast.success(`Loaded ${template.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load template');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Predefined templates</h2>
          </div>
          {predefined.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {predefined.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  className={`rounded-3xl border p-4 text-left transition-all ${selectedId === template.id ? 'border-primary/40 bg-primary/10' : 'border-white/8 bg-white/[0.03]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-foreground">{template.name}</div>
                    <Badge>Built-in</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{template.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No predefined templates" description="Add seed data through the database migration to surface the built-in library." />
          )}
          <Button className="mt-4" onClick={loadSelected} disabled={!selectedId}>
            <Sparkles className="h-4 w-4" />
            Load selected template
          </Button>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Save current workout</h2>
          </div>
          <div className="space-y-4">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" />
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Template description" />
            <Button className="w-full" onClick={saveCurrent} disabled={!name || currentWorkouts.length === 0}>
              Save as template
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Your templates</h2>
        </div>
        {custom.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {custom.map((template) => (
              <div key={template.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <div className="font-medium text-foreground">{template.name}</div>
                <div className="mt-2 text-sm text-muted-foreground">{template.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No custom templates yet" description="Save your current workout once you have a few exercises in the session." />
        )}
      </Card>
    </div>
  );
}
