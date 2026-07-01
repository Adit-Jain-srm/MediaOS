import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-2/3 max-w-lg" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
    </div>
  );
}
