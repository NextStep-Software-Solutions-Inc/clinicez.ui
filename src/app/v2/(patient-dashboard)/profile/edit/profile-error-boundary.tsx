'use client'

import { ReactNode } from 'react'

interface ProfileErrorBoundaryProps {
  children: ReactNode
  error?: Error
  reset?: () => void
}

/**
 * Profile Error Boundary
 * 
 * Catches errors during profile loading and displays user-friendly error UI.
 * This is a client component that handles error.tsx patterns.
 */
export function ProfileErrorBoundary({
  error,
  reset,
}: ProfileErrorBoundaryProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/20 via-blue-50/20 to-slate-100 dark:from-slate-950/20 dark:via-blue-950/20 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Failed to Load Profile
          </h2>
          <p className="text-red-700 dark:text-red-300">
            {error?.message || 'An error occurred while loading your profile data.'}
          </p>
          {reset && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
