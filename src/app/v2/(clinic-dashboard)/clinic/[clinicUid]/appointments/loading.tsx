import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentsLoading() {
  return (
    <div
      className="space-y-0 rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: "hsl(var(--color-border-light, var(--border)))" }}
    >
      {/* Header skeleton */}
      <div
        className="px-5 pt-4 pb-3 border-b"
        style={{ background: "hsl(var(--background) / 0.92)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Appointment rows skeleton */}
      <div className="flex flex-col gap-2 px-4 py-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border"
            style={{ borderLeftWidth: 4, borderLeftColor: "hsl(var(--primary) / 0.15)" }}
          >
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="hidden md:flex gap-4 flex-shrink-0">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
