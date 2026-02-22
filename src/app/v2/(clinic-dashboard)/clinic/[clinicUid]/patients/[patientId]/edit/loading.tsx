export default function ClinicPatientEditLoading() {
  return (
    <div className="w-full">
      {/* Section nav strip skeleton (mirrors the sectionNav rendered when headerSlot=null) */}
      <div className="sticky top-12 z-40 backdrop-blur-sm bg-white/20 dark:bg-slate-950/20 border-b border-slate-200/20 dark:border-slate-800/20 mb-8 -mx-8 px-8 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-9 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg flex-shrink-0 w-24 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Section cards skeleton */}
      <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl p-6 md:p-8 animate-pulse"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-slate-300/50 dark:bg-slate-600/50 rounded-full" />
              <div>
                <div className="h-6 bg-slate-300/50 dark:bg-slate-600/50 rounded w-48 mb-2" />
                <div className="h-4 bg-slate-200/40 dark:bg-slate-700/40 rounded w-64" />
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-10 bg-slate-200/40 dark:bg-slate-700/40 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
