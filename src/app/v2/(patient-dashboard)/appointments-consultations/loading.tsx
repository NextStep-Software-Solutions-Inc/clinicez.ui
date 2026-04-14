export default function AppointmentsConsultationsLoading() {
  return (
    <div className="w-full space-y-4 pt-2">
      {/* Search bar skeleton */}
      <div className="h-11 w-full bg-slate-200/60 dark:bg-slate-700/50 rounded-full animate-pulse" />

      {/* Filter tabs skeleton */}
      <div className="flex gap-2">
        {['All', 'Appointments', 'Consultations'].map((label) => (
          <div
            key={label}
            className="h-9 rounded-full bg-slate-200/60 dark:bg-slate-700/50 animate-pulse"
            style={{ width: label === 'All' ? 48 : label === 'Appointments' ? 120 : 130 }}
          />
        ))}
      </div>

      {/* Card list skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 space-y-3 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-24 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-3 w-28 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
              <div className="h-3 w-20 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

