import { ShimmerSkeleton } from "@/components/motion";
import { SkeletonCard } from "@/components/ui/states";

export default function CampaignsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-6 w-40" />
        <ShimmerSkeleton className="h-4 w-2/3 max-w-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
