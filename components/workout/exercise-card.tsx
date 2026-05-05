'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { Input } from '@/components/shared/input';
import { Textarea } from '@/components/shared/textarea';
import { cn, formatWeight } from '@/lib/utils';
import type { WorkoutItem } from '@/lib/store/workout-store';

interface ExerciseCardProps {
  item: WorkoutItem;
  onSave: (itemId: string, patch: Partial<WorkoutItem>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onToggleSet: (itemId: string, setId: string, completed: boolean) => Promise<void>;
}

export function ExerciseCard({ item, onDelete, onSave, onToggleSet }: ExerciseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(item.exerciseName);
  const [draftMuscle, setDraftMuscle] = useState(item.muscleGroup);
  const [draftNotes, setDraftNotes] = useState(item.notes ?? '');
  const [draftSets, setDraftSets] = useState(item.sets);

  const completedSets = useMemo(() => item.sets.filter((set) => set.completed).length, [item.sets]);

  async function save() {
    await onSave(item.id, {
      exerciseName: draftName,
      muscleGroup: draftMuscle,
      notes: draftNotes,
      sets: draftSets
    } as Partial<WorkoutItem>);
    setIsEditing(false);
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300',
        item.isComplete ? 'border-emerald-400/20 bg-emerald-500/5' : 'hover:-translate-y-0.5 hover:border-primary/30'
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">{item.exerciseName}</h3>
              {item.isComplete ? <Check className="h-4 w-4 text-emerald-400" /> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.muscleGroup} • {completedSets}/{item.sets.length} sets completed
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing((current) => !current)}>
              <Pencil className="h-4 w-4" />
              {isEditing ? 'Close' : 'Edit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                <Input value={draftMuscle} onChange={(event) => setDraftMuscle(event.target.value)} />
              </div>
              <Textarea value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
              <div className="space-y-3">
                {draftSets.map((set, index) => (
                  <div key={index} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-muted-foreground">Set {index + 1}</span>
                    <Input
                      type="number"
                      value={set.reps}
                      onChange={(event) => {
                        const next = [...draftSets];
                        next[index] = { ...set, reps: Number(event.target.value) };
                        setDraftSets(next);
                      }}
                    />
                    <Input
                      type="number"
                      value={set.weight}
                      onChange={(event) => {
                        const next = [...draftSets];
                        next[index] = { ...set, weight: Number(event.target.value) };
                        setDraftSets(next);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{set.completed ? 'Done' : 'Pending'}</span>
                  </div>
                ))}
              </div>
              <Button onClick={save}>Save changes</Button>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-3"
            >
              {item.notes ? <p className="text-sm text-muted-foreground">{item.notes}</p> : null}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {item.sets.map((set) => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => onToggleSet(item.id, set.id, !set.completed)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                      set.completed
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                        : 'border-white/8 bg-white/[0.03] hover:border-primary/30 hover:bg-white/[0.05]'
                    )}
                  >
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Set {set.setIndex + 1}</div>
                      <div className="mt-1 text-base font-medium text-foreground">
                        {set.reps} reps • {formatWeight(set.weight)}
                      </div>
                    </div>
                    <Check className={cn('h-4 w-4', set.completed ? 'text-emerald-400' : 'text-muted-foreground')} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
