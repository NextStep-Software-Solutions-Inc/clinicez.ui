'use client'

import { useRouter } from 'next/navigation'
import { Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Search className="w-12 h-12 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Profile Not Found
        </h2>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          The patient profile you're looking for doesn't exist or may have been removed.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push('/v2')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </button>
        </div>

        {/* Helpful text */}
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          Error Code: 404 | Not Found
        </p>
      </div>
    </div>
  )
}
