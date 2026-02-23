export default function BookAppointmentLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg dark:bg-slate-700/50 bg-slate-200/60 animate-pulse" />
          <div>
            <div className="h-7 w-52 dark:bg-slate-700/50 bg-slate-200/60 rounded-lg animate-pulse mb-1.5" />
            <div className="h-4 w-32 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg dark:bg-slate-700/50 bg-slate-200/60 animate-pulse" />
      </div>

      {/* Step indicator skeleton */}
      <div className="flex items-center mb-8">
        {[1, 2, 3, 4, 5].map((n, i) => (
          <div key={n} className="contents">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full dark:bg-slate-700/50 bg-slate-200/60 animate-pulse" />
              <div className="h-3 w-12 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse hidden sm:block" />
            </div>
            {i < 4 && (
              <div className="flex-1 h-0.5 mt-4 dark:bg-slate-700/40 bg-slate-200/40 animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Card skeleton */}
      <div className="dark:bg-slate-800/30 bg-white/40 rounded-2xl dark:border-white/10 border-slate-200/60 border shadow-lg p-6 md:p-8 space-y-6">
        <div>
          <div className="h-6 w-48 dark:bg-slate-700/50 bg-slate-200/60 rounded-lg animate-pulse mb-1.5" />
          <div className="h-4 w-72 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
          <div className="h-10 dark:bg-slate-700/50 bg-slate-200/60 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-28 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
          <div className="h-24 dark:bg-slate-700/50 bg-slate-200/60 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-2">
              <div className="h-3 w-20 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
              <div className="h-10 dark:bg-slate-700/50 bg-slate-200/60 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-28 dark:bg-slate-700/50 bg-slate-200/60 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
