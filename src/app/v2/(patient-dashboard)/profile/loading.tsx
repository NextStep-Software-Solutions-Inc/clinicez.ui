'use client'

export default function ProfileLoading() {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-slate-50/20 via-blue-50/20 to-transparent dark:from-slate-950/20 dark:via-blue-950/20 dark:to-transparent backdrop-blur-sm mb-8 px-8 pt-4 pb-6 rounded-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-slate-300/60 dark:bg-slate-600/60 animate-pulse"></div>
              <div className="h-8 bg-slate-300/60 dark:bg-slate-600/60 rounded-lg flex-1 max-w-xs animate-pulse"></div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-300/60 dark:bg-slate-600/60 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto pb-32">
        {/* Profile Card Skeleton */}
        <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl mb-8 overflow-hidden">
          {/* Header Gradient */}
          <div className="h-32 bg-gradient-to-r from-slate-300/50 to-slate-200/50 dark:from-slate-600/50 dark:to-slate-500/50 animate-pulse"></div>

          {/* Profile Info */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <div className="h-8 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-1/2 animate-pulse"></div>
              </div>
              
              {/* Age */}
              <div className="space-y-2">
                <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-12 animate-pulse"></div>
                <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-16 animate-pulse"></div>
              </div>
              
              {/* Blood Type */}
              <div className="space-y-2">
                <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-16 animate-pulse"></div>
                <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-20 animate-pulse"></div>
              </div>
              
              {/* Clinic */}
              <div className="space-y-2">
                <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-20 animate-pulse"></div>
                <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-24 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-300/60 dark:bg-slate-600/60 rounded-lg animate-pulse min-w-[120px]"></div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {/* Demographics Card */}
          <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-6">
            <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-48 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-16 animate-pulse"></div>
                  <div className="h-5 bg-slate-300/40 dark:bg-slate-600/40 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-4">
                <div className="space-y-3 text-center">
                  <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-20 mx-auto animate-pulse"></div>
                  <div className="h-8 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-16 mx-auto animate-pulse"></div>
                  <div className="h-3 bg-slate-300/25 dark:bg-slate-600/25 rounded w-12 mx-auto animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Latest Vital Signs */}
          <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-6 border-red-200/30 dark:border-red-500/20">
            <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-48 mb-6 animate-pulse"></div>
            
            {/* Vital Signs Grid */}
            <div className="grid grid-cols-3 gap-8 mb-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Remarks Section */}
            <div className="space-y-3">
              <div className="h-4 bg-slate-300/30 dark:bg-slate-600/30 rounded w-24 animate-pulse"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-300/25 dark:bg-slate-600/25 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Two Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-6">
                <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-40 mb-6 animate-pulse"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-10 bg-slate-300/25 dark:bg-slate-600/25 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Procedure History */}
          <div className="rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-6">
            <div className="h-6 bg-slate-300/40 dark:bg-slate-600/40 rounded-lg w-48 mb-6 animate-pulse"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-300/25 dark:bg-slate-600/25 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Footer Spacing */}
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  )
}
