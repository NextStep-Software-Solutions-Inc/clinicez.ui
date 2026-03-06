'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/patient-dashboard-v2/ThemeToggle'

export function ProfileHeader() {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-b from-slate-50/20 via-blue-50/20 to-transparent dark:from-slate-950/20 dark:via-blue-950/20 dark:to-transparent backdrop-blur-sm mb-6 md:mb-8 px-4 md:px-8 pt-3 pb-4 md:pt-4 md:pb-6 rounded-xl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
              Comprehensive Health Records
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
