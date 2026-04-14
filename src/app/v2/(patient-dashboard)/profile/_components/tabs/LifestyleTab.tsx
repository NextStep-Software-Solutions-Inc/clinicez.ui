'use client'

import { Heart } from 'lucide-react'
import type { LifestyleTabData } from '@/types/patient-profile-tabs'

type Props = { data: LifestyleTabData }

export function LifestyleTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Heart className="w-5 h-5 text-teal-500" /> Lifestyle &amp; Personal History</h3>
        {data.personalHistory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.personalHistory.smokingStatus && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Smoking</p>
                <p className="font-semibold text-slate-900 dark:text-white">{data.personalHistory.smokingStatus}</p>
              </div>
            )}
            {data.personalHistory.alcoholStatus && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Alcohol</p>
                <p className="font-semibold text-slate-900 dark:text-white">{data.personalHistory.alcoholStatus}</p>
              </div>
            )}
            {data.personalHistory.illicitDrugUse && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Drug Use</p>
                <p className="font-semibold text-slate-900 dark:text-white">{data.personalHistory.illicitDrugUse}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No personal history recorded</p>
        )}
      </div>
    </div>
  )
}
