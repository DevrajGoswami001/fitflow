import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-start gap-4 border-dashed border-white/10 bg-white/[0.03]">
      <Badge>Empty state</Badge>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </Card>
  );
}
