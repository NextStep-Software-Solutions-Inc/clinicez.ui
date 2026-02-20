"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface PatientRowSkeletonProps {
  viewMode?: "list" | "grid";
}

function PatientRowSkeleton({ viewMode = "list" }: PatientRowSkeletonProps) {
  if (viewMode === "grid") {
    return (
      <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1 text-center">
            <Skeleton className="h-3 w-12 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/30 dark:border-slate-700/30 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: "hsl(var(--primary) / 0.2)" }}
    >
      <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="hidden md:flex gap-6 flex-shrink-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
    </div>
  );
}

interface PatientListSkeletonProps {
  count?: number;
  viewMode?: "list" | "grid";
}

export function PatientListSkeleton({
  count = 8,
  viewMode = "list",
}: PatientListSkeletonProps) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 px-4 py-4"
          : "flex flex-col gap-2 px-4 py-4"
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <PatientRowSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );
}
