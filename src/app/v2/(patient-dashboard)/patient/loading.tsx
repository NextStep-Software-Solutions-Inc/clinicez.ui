import { Skeleton } from "@/components/ui/skeleton"

export default function PatientDashboardLoading() {
  return (
    <div className="w-full space-y-6 pt-2">
      {/* Hero greeting block */}
      <div className="h-32 rounded-2xl bg-gradient-to-r from-slate-300/50 to-slate-200/50 dark:from-slate-700/50 dark:to-slate-600/50 animate-pulse" />

      {/* Quick vitals row */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-28 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Next appointment section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-36 rounded-2xl" />
      </div>

      {/* Upcoming */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-44 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Medications */}
      <div>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Recent Consultations */}
      <div>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

