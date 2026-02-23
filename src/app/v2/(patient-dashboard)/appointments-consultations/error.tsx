'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Appointments & Consultations page error:', error)
  }, [error])

  const router = useRouter()

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">
          Something went wrong
        </h1>
        <p className="dark:text-slate-400 text-slate-600 mb-6">
          We encountered an error while loading your appointments and
          consultation history. Please try again.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() => router.push('/v2/patient')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 dark:text-white text-slate-900 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
