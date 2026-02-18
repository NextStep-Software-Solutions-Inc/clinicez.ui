'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Profile page error:', error)
  }, [error])

  const router = useRouter()

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          We encountered an error while loading your profile. Please try again.
        </p>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/v2')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
