'use client'

export default function ProfileLoading() {
  return (
    <div className="w-full space-y-5 pt-2">
      {/* Hero gradient block */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-teal-400/40 to-indigo-400/40 dark:from-teal-700/40 dark:to-indigo-700/40 animate-pulse">
        <div className="h-24" />
        <div className="px-4 pb-4 space-y-3">
          <div className="flex justify-center -mt-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-300/60 dark:bg-slate-600/60" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-40 bg-slate-300/60 dark:bg-slate-600/60 rounded-lg" />
            <div className="h-4 w-24 bg-slate-300/40 dark:bg-slate-600/40 rounded" />
          </div>
          {/* Stat chips */}
          <div className="flex gap-3 justify-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 w-20 bg-slate-300/40 dark:bg-slate-600/40 rounded-xl" />
            ))}
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 justify-center">
            <div className="h-10 w-32 bg-slate-300/60 dark:bg-slate-600/60 rounded-xl" />
            <div className="h-10 w-32 bg-slate-300/60 dark:bg-slate-600/60 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-x-hidden pb-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-full bg-slate-200/60 dark:bg-slate-700/50 animate-pulse flex-shrink-0"
            style={{ width: `${70 + i * 10}px` }}
          />
        ))}
      </div>

      {/* Content blocks */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 space-y-3 animate-pulse"
          >
            <div className="h-5 w-40 bg-slate-200/60 dark:bg-slate-700/50 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-1">
                  <div className="h-3 w-16 bg-slate-200/40 dark:bg-slate-700/40 rounded" />
                  <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/50 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer spacing */}
      <div className="h-4" />
    </div>
  )
}

