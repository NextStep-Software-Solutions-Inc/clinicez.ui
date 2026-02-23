import { Skeleton } from "@/components/ui/skeleton";

export default function PatientFilesLoading() {
  return (
    <div className="w-full space-y-6">
      <div className="sticky top-0 z-50 glassmorphic-card px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md bg-slate-200/60 dark:bg-slate-700/60" />
          <Skeleton className="h-7 w-32 bg-slate-200/60 dark:bg-slate-700/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md bg-slate-200/60 dark:bg-slate-700/60" />
          <Skeleton className="h-8 w-8 rounded-md bg-slate-200/60 dark:bg-slate-700/60" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glassmorphic-card h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
