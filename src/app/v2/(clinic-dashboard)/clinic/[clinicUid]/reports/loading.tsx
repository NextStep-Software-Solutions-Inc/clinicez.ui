import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-t-md" />
        ))}
      </div>

      {/* Overview KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appointments breakdown */}
        <div className="rounded-xl border p-4 space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Consultations breakdown */}
        <div className="rounded-xl border p-4 space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostics row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>

      {/* Daily trend skeleton */}
      <div className="rounded-xl border p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-end gap-1 h-24">
          {[40, 65, 30, 80, 55, 70, 45, 90, 35, 60, 75, 50, 85, 40, 65, 55, 70, 45, 80, 60].map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
