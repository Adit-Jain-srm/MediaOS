import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonMetrics } from "@/components/ui/states";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-2/3 max-w-lg" />
      </div>
      <SkeletonMetrics count={6} className="lg:grid-cols-3 xl:grid-cols-6" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
