/**
 * Loading UI for Edit Profile Page
 *
 * Automatically displayed by Next.js while the page content is loading.
 * Mocks the actual layout with skeleton elements for better UX.
 */
export default function Loading() {
  return (
    <div className="w-full">
      {/* Sticky Header Skeleton */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/20 dark:bg-slate-950/20 border-b border-slate-200/20 dark:border-slate-800/20 mb-8 -mx-8 px-8 py-4 rounded-b-3xl">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              {/* Back button skeleton */}
              <div className="w-10 h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg"></div>
              <div className="flex-1">
                {/* Title skeleton */}
                <div className="h-8 bg-slate-200/50 dark:bg-slate-700/50 rounded w-40 mb-2"></div>
                {/* Subtitle skeleton */}
                <div className="h-4 bg-slate-200/30 dark:bg-slate-700/30 rounded w-60"></div>
              </div>
            </div>
            {/* Theme toggle skeleton */}
            <div className="w-10 h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg"></div>
          </div>

          {/* Horizontal Section Navigation Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 md:-mx-8 px-4 md:px-8 mt-4">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg flex-shrink-0 w-24"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8 px-4 md:px-0">
          {/* Section Skeletons */}
          {[...Array(5)].map((_, sectionIdx) => (
            <div
              key={sectionIdx}
              className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/40 rounded-2xl p-6 md:p-8 animate-pulse"
            >
              {/* Section Header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-slate-200/50 dark:bg-slate-700/50 rounded-full flex-shrink-0"></div>
                <div className="h-6 bg-slate-200/50 dark:bg-slate-700/50 rounded w-48"></div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, fieldIdx) => (
                  <div key={fieldIdx} className="space-y-2">
                    {/* Field label */}
                    <div className="h-4 bg-slate-200/40 dark:bg-slate-700/40 rounded w-3/4"></div>
                    {/* Field input */}
                    <div className="h-10 bg-slate-100/50 dark:bg-slate-800/50 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
