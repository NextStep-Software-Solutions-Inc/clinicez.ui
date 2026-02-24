export default function BookAppointmentLoading() {
  return (
    /* Mirrors BookAppointmentWizard shell: sticky progress header + scrollable body + bottom bar */
    <div className="-mx-4 sm:-mx-0">
      {/* Progress header skeleton */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 -mx-4 sm:-mx-0 px-4 pb-0">
        {/* Thin progress strip */}
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700/60 mb-3">
          <div className="h-full w-[20%] bg-teal-400/40 animate-pulse rounded-full" />
        </div>
        <div className="flex items-center gap-3 pb-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/50 animate-pulse shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse mb-1.5" />
            <div className="h-3 w-32 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Step content skeleton */}
      <div className="px-4 sm:px-0 max-w-lg mx-auto pt-5 pb-28 space-y-5">
        {/* Heading */}
        <div>
          <div className="h-7 w-52 bg-slate-200 dark:bg-slate-700/50 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
        </div>
        {/* Input fields */}
        <div className="space-y-2">
          <div className="h-3.5 w-20 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
          <div className="h-12 bg-slate-200 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-36 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
          <div className="h-24 bg-slate-200 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-2">
              <div className="h-3.5 w-28 bg-slate-200/60 dark:bg-slate-700/40 rounded animate-pulse" />
              <div className="h-12 bg-slate-200 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action bar skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 px-4 pt-3 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="h-14 bg-teal-200/60 dark:bg-teal-900/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
