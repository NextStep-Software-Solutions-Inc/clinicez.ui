export default function ConsultationsLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* ── Left Sidebar Skeleton ── */}
      <aside className="w-80 shrink-0 border-r border-border/50 flex flex-col bg-background/60">
        {/* Sidebar Header Skeleton */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/50 shrink-0 animate-pulse">
          <div className="flex items-center gap-2.5">
            {/* Back Button Skeleton */}
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1">
              <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          {/* New Button Skeleton */}
          <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-md shrink-0" />
        </div>

        {/* List Items Skeletons */}
        <div className="flex-1 overflow-hidden p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2 animate-pulse"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
              </div>
              <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-40 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right Workspace Skeleton ── */}
      <main className="flex-1 flex flex-col overflow-hidden p-6 space-y-6 animate-pulse">
        {/* Consultation Workspace Header */}
        <div className="space-y-2 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-40 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded font-mono" />
            </div>
            <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="w-64 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-full max-w-2xl h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        {/* Sub-Tabs Row Skeleton */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-24 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>

        {/* Main Section Content Card Skeleton */}
        <div className="flex-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div className="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-full h-32 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
          <div className="w-full h-24 bg-slate-200/40 dark:bg-slate-800/40 rounded-xl" />
        </div>
      </main>
    </div>
  )
}
