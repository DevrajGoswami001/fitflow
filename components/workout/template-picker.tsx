'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { cn } from '@/lib/utils';
import type { TemplateSnapshot } from '@/lib/queries';
import type { WorkoutTemplateItem } from '@/lib/store/workout-store';

interface TemplatePickerProps {
  templates: TemplateSnapshot[];
  onLoadTemplate: (templateId: string) => Promise<void>;
  onSaveTemplate: (name: string, description: string) => Promise<void>;
  currentWorkouts: WorkoutTemplateItem[];
}

export function TemplatePicker({ templates, onLoadTemplate, onSaveTemplate, currentWorkouts }: TemplatePickerProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const userTemplates = useMemo(() => templates.filter((template) => !template.isPredefined), [templates]);
  const predefinedTemplates = useMemo(() => templates.filter((template) => template.isPredefined), [templates]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Templates</h3>
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {predefinedTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={cn(
                  'rounded-3xl border p-4 text-left transition-all',
                  selectedTemplateId === template.id
                    ? 'border-primary/40 bg-primary/10 shadow-glow'
                    : 'border-white/8 bg-white/[0.03] hover:border-primary/20'
                )}
              >
                <div className="text-base font-semibold text-foreground">{template.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{template.description}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => onLoadTemplate(selectedTemplateId)}
              disabled={!selectedTemplateId}
            >
              <Upload className="h-4 w-4" />
              Load template
            </Button>
          </div>
          {userTemplates.length > 0 ? (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-medium text-muted-foreground">Your templates</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {userTemplates.map((template) => (
                  <div key={template.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-sm font-medium text-foreground">{template.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Save workout as template</h3>
        </div>
        <div className="space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Template name"
            className="h-11 w-full rounded-2xl border border-border bg-white/3 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a short description"
            className="min-h-[100px] w-full rounded-2xl border border-border bg-white/3 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <Button
            onClick={() => onSaveTemplate(name, description)}
            disabled={!name || currentWorkouts.length === 0}
            className="w-full"
          >
            <Sparkles className="h-4 w-4" />
            Save current workout
          </Button>
        </div>
      </Card>
    </div>
  );
}
