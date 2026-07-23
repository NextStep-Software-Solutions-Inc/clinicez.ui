export default function PatientFilesLoading() {
  return (
    <div className="relative min-h-screen">
      {/* Glassmorphic ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-72 w-72 rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Patient Context Card Skeleton */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-3 sm:p-4 shadow-sm animate-pulse flex items-center gap-3 sm:gap-4">
          {/* Back Button Skeleton */}
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          {/* Avatar Skeleton */}
          <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-40 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-14 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-14 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header Action Row */}
        <div className="flex items-center justify-between gap-4 animate-pulse">
          <div className="w-36 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="w-28 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
        </div>

        {/* Folders Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 space-y-3 animate-pulse shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="space-y-1">
                <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
