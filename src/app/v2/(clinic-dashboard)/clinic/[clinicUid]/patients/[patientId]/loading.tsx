export default function ClinicPatientProfileLoading() {
  return (
    <div className="w-full space-y-4 max-w-6xl mx-auto pb-24">
      {/* Patient Profile Card Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Back Button Skeleton */}
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            {/* Avatar Skeleton */}
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-4 w-28 bg-indigo-200/60 dark:bg-indigo-900/40 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          </div>
          {/* Action Button Skeleton */}
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg self-end sm:self-center" />
        </div>

        {/* Quick Vitals Summary Row Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/60 rounded" />
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Tab Navigation Bar Skeleton */}
      <div className="sticky top-12 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-1 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-8 rounded-lg flex-shrink-0 animate-pulse ${
                i === 0 ? 'w-40 bg-indigo-200 dark:bg-indigo-900/50' : 'w-32 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Primary Tab Content Skeleton (Ultra-Dense 5-Column Grid Card) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 shadow-sm space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-200 dark:bg-indigo-900/50" />
            <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>

        {/* 5-Column High-Density Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-3 py-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Dependents Table Skeleton */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
