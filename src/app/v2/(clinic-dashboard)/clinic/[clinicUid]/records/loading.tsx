import { Skeleton } from "@/components/ui/skeleton";

export default function RecordsLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-56 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border rounded-lg p-1 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md flex-shrink-0" />
        ))}
      </div>

      {/* Record cards skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 space-y-2">
                {/* Serial + badge row */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                {/* Patient row */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-40" />
                </div>
                {/* Procedure badges */}
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              {/* Date */}
              <Skeleton className="h-4 w-24 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
