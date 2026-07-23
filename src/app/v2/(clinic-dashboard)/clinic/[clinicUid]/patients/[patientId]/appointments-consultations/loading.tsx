export default function AppointmentsConsultationsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 px-3 sm:px-4 py-3 sm:py-4 pb-20 sm:pb-24">
      {/* High-Density Patient Header Banner Card Skeleton */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-3 sm:p-4 shadow-sm animate-pulse">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Back Button Skeleton */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            {/* Avatar Skeleton */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5">
              {/* Name Skeleton */}
              <div className="w-36 sm:w-48 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              {/* Badges Skeleton */}
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-20 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          </div>
          {/* Action Button Skeleton */}
          <div className="w-full sm:w-36 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Timeline Section Skeleton */}
      <div className="space-y-3 pt-1">
        {/* Section Heading Skeleton */}
        <div className="w-44 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse px-1" />

        {/* Timeline Items Skeletons */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative flex gap-3 sm:gap-4 animate-pulse">
              {/* Timeline Connector */}
              <div className="relative flex flex-col items-center shrink-0 w-4 sm:w-5">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-slate-200 dark:ring-slate-800 mt-1 shrink-0 z-10" />
                {i < 2 && <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-1 mt-1" />}
              </div>

              {/* Card Skeleton */}
              <div className="flex-1 min-w-0 pb-4 sm:pb-5">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-3 sm:p-4 shadow-xs space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-48 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-32 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-md shrink-0" />
                  </div>

                  {/* Body Lines */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
