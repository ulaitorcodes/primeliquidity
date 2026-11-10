import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="ml-auto h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="mt-5 h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}