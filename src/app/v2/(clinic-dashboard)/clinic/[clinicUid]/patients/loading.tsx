import { Skeleton } from "@/components/ui/skeleton";

export default function ClinicPatientsLoading() {
  return (
    <div className="space-y-0 rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: "hsl(var(--color-border-light, var(--border)))" }}
    >
      {/* ── Header skeleton ──────────────────────────────────────────── */}
      <div
        className="px-5 pt-4 pb-3 border-b"
        style={{ background: "hsl(var(--background) / 0.92)" }}
      >
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          {/* Search bar */}
          <Skeleton className="h-9 w-full max-w-xs rounded-md" />
          {/* Controls */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* ── Patient rows skeleton ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-4 py-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: "hsl(var(--primary) / 0.15)",
            }}
          >
            {/* Avatar */}
            <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />

            {/* Name + meta */}
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>

            {/* Stats (hidden on mobile) */}
            <div className="hidden md:flex gap-6 flex-shrink-0">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1 text-center">
                  <Skeleton className="h-3 w-16 mx-auto" />
                  <Skeleton className="h-5 w-8 mx-auto" />
                </div>
              ))}
            </div>

            {/* Chevron */}
            <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
