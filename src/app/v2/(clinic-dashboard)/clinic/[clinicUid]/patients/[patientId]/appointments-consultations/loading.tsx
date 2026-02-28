export default function AppointmentsConsultationsLoading() {
  return (
    <div className="w-full">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-10 border-b border-border/50 px-6 sm:px-8 py-4 -mx-6 sm:-mx-8 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-20 h-5 bg-slate-300/60 dark:bg-slate-600/60 rounded animate-pulse" />
            <div className="w-4 h-4 bg-slate-300/60 dark:bg-slate-600/60 rounded animate-pulse" />
            <div className="w-36 h-5 bg-slate-300/60 dark:bg-slate-600/60 rounded animate-pulse" />
          </div>
          <div className="w-52 h-8 bg-slate-300/60 dark:bg-slate-600/60 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Split-panel skeleton */}
      <div className="flex h-[calc(100dvh-16rem)] overflow-hidden border border-border/40 rounded-lg">
        {/* Left: list skeleton */}
        <aside className="w-80 shrink-0 border-r border-border/50 flex flex-col">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="h-4 bg-slate-300/60 dark:bg-slate-600/60 rounded w-3/4 animate-pulse mb-1.5" />
            <div className="h-3 bg-slate-300/40 dark:bg-slate-600/40 rounded w-1/2 animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 border-b border-border/30 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 bg-slate-300/60 dark:bg-slate-600/60 rounded flex-1 animate-pulse" />
                  <div className="h-5 w-16 bg-slate-300/40 dark:bg-slate-600/40 rounded-full animate-pulse shrink-0" />
                </div>
                <div className="h-3 bg-slate-300/40 dark:bg-slate-600/40 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-slate-300/30 dark:bg-slate-600/30 rounded w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        </aside>

        {/* Right: detail skeleton */}
        <main className="flex-1 p-6 space-y-6">
          <div>
            <div className="h-5 w-24 bg-slate-300/60 dark:bg-slate-600/60 rounded-full animate-pulse mb-2" />
            <div className="h-7 bg-slate-300/60 dark:bg-slate-600/60 rounded w-64 animate-pulse mb-1.5" />
            <div className="h-3 bg-slate-300/40 dark:bg-slate-600/40 rounded w-40 animate-pulse" />
          </div>
          <div className="rounded-lg border border-border/40 p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-300/40 dark:bg-slate-600/40 rounded animate-pulse mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded animate-pulse" />
            ))}
          </div>
          <div>
            <div className="h-3 w-28 bg-slate-300/40 dark:bg-slate-600/40 rounded animate-pulse mb-3" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/40 p-4 mb-3 space-y-2"
              >
                <div className="h-3 w-20 bg-slate-300/30 dark:bg-slate-600/30 rounded animate-pulse" />
                <div className="h-4 bg-slate-300/40 dark:bg-slate-600/40 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-300/40 dark:bg-slate-600/40 rounded w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
