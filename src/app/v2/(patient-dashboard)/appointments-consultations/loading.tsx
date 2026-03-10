export default function AppointmentsConsultationsLoading() {
  return (
    <div className="-mx-4 sm:-mx-6 md:-mx-8 -mb-6 md:-mb-8 lg:-mb-10">
      {/* Header skeleton */}
      <div className="px-4 sm:px-6 md:px-8 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg dark:bg-slate-700/50 bg-slate-200/60 animate-pulse" />
          <div>
            <div className="h-7 w-72 dark:bg-slate-700/50 bg-slate-200/60 rounded-lg animate-pulse mb-1.5" />
            <div className="h-4 w-40 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg dark:bg-slate-700/50 bg-slate-200/60 animate-pulse" />
      </div>

      {/* Split panel skeleton */}
      <div className="flex h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-7rem)] overflow-hidden dark:bg-slate-800/30 bg-white/40 rounded-t-2xl dark:border-white/10 border-slate-200/60 border-t border-x">
        {/* Left: list */}
        <aside className="w-80 shrink-0 dark:border-r dark:border-white/10 border-r border-slate-200/60 flex flex-col">
          <div className="px-4 py-3 dark:border-b dark:border-white/10 border-b border-slate-200/60">
            <div className="h-4 dark:bg-slate-700/50 bg-slate-200/60 rounded w-3/4 animate-pulse mb-1.5" />
            <div className="h-3 dark:bg-slate-700/40 bg-slate-200/40 rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 dark:border-b dark:border-white/5 border-b border-slate-200/60 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="w-3.5 h-3.5 rounded-full dark:bg-slate-700/50 bg-slate-200/60 animate-pulse shrink-0" />
                    <div className="h-4 dark:bg-slate-700/50 bg-slate-200/60 rounded flex-1 animate-pulse" />
                  </div>
                  <div className="h-5 w-16 dark:bg-slate-700/40 bg-slate-200/40 rounded-full animate-pulse shrink-0" />
                </div>
                <div className="h-3 dark:bg-slate-700/40 bg-slate-200/40 rounded w-3/5 animate-pulse ml-5" />
                <div className="h-3 dark:bg-slate-700/30 bg-slate-200/30 rounded w-2/5 animate-pulse ml-5" />
              </div>
            ))}
          </div>
        </aside>

        {/* Right: detail */}
        <main className="flex-1 p-6 space-y-6">
          <div>
            <div className="h-6 w-20 dark:bg-slate-700/50 bg-slate-200/60 rounded-full animate-pulse mb-2" />
            <div className="h-7 dark:bg-slate-700/50 bg-slate-200/60 rounded w-72 animate-pulse mb-1.5" />
            <div className="h-4 dark:bg-slate-700/40 bg-slate-200/40 rounded w-40 animate-pulse" />
          </div>
          <div className="dark:bg-slate-800/40 bg-slate-100/60 rounded-xl p-4 space-y-3">
            <div className="h-3 w-24 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 dark:bg-slate-700/30 bg-slate-200/30 rounded animate-pulse" />
            ))}
          </div>
          <div>
            <div className="h-3 w-28 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse mb-3" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-lg p-4 mb-3 space-y-2 dark:border-white/10 border-slate-200/60 border"
              >
                <div className="h-3 w-20 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
                <div className="h-4 dark:bg-slate-700/40 bg-slate-200/40 rounded animate-pulse" />
                <div className="h-4 dark:bg-slate-700/30 bg-slate-200/30 rounded w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
