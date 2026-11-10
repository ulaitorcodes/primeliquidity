import { CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <div className="mt-10">
        <CardGridSkeleton count={3} />
      </div>
    </section>
  );
}