import { Skeleton } from "@/components/ui/skeleton";

export default function PatientFilesLoading() {
  return (
    <div className="w-full space-y-6">
      <div className="glassmorphic-card p-5 flex items-center justify-between">
        <Skeleton className="h-8 w-32 bg-slate-200/60 dark:bg-slate-700/60" />
        <Skeleton className="h-9 w-32 bg-slate-200/60 dark:bg-slate-700/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glassmorphic-card h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
