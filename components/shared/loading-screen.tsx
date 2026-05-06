import { Skeleton } from '@/components/shared/skeleton';

export function LoadingScreen() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full sm:w-72 max-w-md" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}
