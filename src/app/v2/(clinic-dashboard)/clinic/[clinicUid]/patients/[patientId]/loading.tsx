export default function ClinicPatientProfileLoading() {
  return (
    <div className="w-full">
      {/* Sticky header skeleton */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-slate-50/20 via-blue-50/20 to-transparent dark:from-slate-950/20 dark:via-blue-950/20 dark:to-transparent backdrop-blur-sm mb-8 px-8 pt-4 pb-6 rounded-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-slate-300/60 dark:bg-slate-600/60 animate-pulse" />
              <div className="h-8 bg-slate-300/60 dark:bg-slate-600/60 rounded-lg flex-1 max-w-xs animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-300/60 dark:bg-slate-600/60 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto pb-32 px-4 sm:px-6">
        {/* Profile card */}
        <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl mb-8 overflow-hidden">
          {/* Header gradient bar */}
          <div className="h-32 bg-gradient-to-r from-slate-300/50 to-slate-200/50 dark:from-slate-600/50 dark:to-slate-500/50 animate-pulse" />
          {/* Demographics grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-16 animate-pulse" />
                  <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-24 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-slate-300/60 dark:bg-slate-600/60 rounded-lg animate-pulse min-w-[120px]"
            />
          ))}
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-6 space-y-6">
          <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-48 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-16 animate-pulse" />
                <div className="h-5 bg-slate-300/40 dark:bg-slate-600/40 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-4 space-y-2"
            >
              <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
