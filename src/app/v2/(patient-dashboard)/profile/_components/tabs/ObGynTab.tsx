'use client'

import { Baby, User } from 'lucide-react'
import type { ObGynTabData } from '@/types/patient-profile-tabs'

type Props = { data: ObGynTabData }

export function ObGynTab({ data }: Props) {
  if (data.gender?.toUpperCase() === 'MALE') {
    return (
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Baby className="w-5 h-5 text-teal-500" /> OB/GYN History</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">OB/GYN records are not applicable</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Obstetric and gynecological history is specific to female patients.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glassmorphic-card p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Baby className="w-5 h-5 text-teal-500" /> OB/GYN History</h3>
      {data.obGyneHistory ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <h4 className="md:col-span-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">Menstrual History</h4>
            {data.obGyneHistory.menarche && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Menarche</p>
                <p className="font-semibold">{data.obGyneHistory.menarche} yrs</p>
              </div>
            )}
            {data.obGyneHistory.lastMenstrualPeriod && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Last Menstrual Period</p>
                <p className="font-semibold">{new Date(data.obGyneHistory.lastMenstrualPeriod).toLocaleDateString()}</p>
              </div>
            )}
            {data.obGyneHistory.menstrualPeriodDuration && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Period Duration</p>
                <p className="font-semibold">{data.obGyneHistory.menstrualPeriodDuration} days</p>
              </div>
            )}
            {data.obGyneHistory.menstrualCycleInterval && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Cycle Interval</p>
                <p className="font-semibold">{data.obGyneHistory.menstrualCycleInterval} days</p>
              </div>
            )}
            {data.obGyneHistory.numberOfPadsPerDay && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Pads Per Day</p>
                <p className="font-semibold">{data.obGyneHistory.numberOfPadsPerDay}</p>
              </div>
            )}
            {data.obGyneHistory.menopauseStatus && data.obGyneHistory.menopauseStatus !== 'NONE' && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Menopause Status</p>
                <p className="font-semibold">{data.obGyneHistory.menopauseStatus}</p>
              </div>
            )}
            {data.obGyneHistory.menopauseAge && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Menopause Age</p>
                <p className="font-semibold">{data.obGyneHistory.menopauseAge} yrs</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <h4 className="md:col-span-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">Sexual History</h4>
            {data.obGyneHistory.ageAtFirstSexualIntercourse && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Age First Intercourse</p>
                <p className="font-semibold">{data.obGyneHistory.ageAtFirstSexualIntercourse} yrs</p>
              </div>
            )}
            {data.obGyneHistory.birthControlMethod && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Birth Control</p>
                <p className="font-semibold">{data.obGyneHistory.birthControlMethod}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <h4 className="md:col-span-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">Pregnancy History</h4>
            {data.obGyneHistory.gravidity !== null && data.obGyneHistory.gravidity !== undefined && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Gravidity</p>
                <p className="font-semibold">{data.obGyneHistory.gravidity}</p>
              </div>
            )}
            {data.obGyneHistory.parity !== null && data.obGyneHistory.parity !== undefined && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Parity</p>
                <p className="font-semibold">{data.obGyneHistory.parity}</p>
              </div>
            )}
            {data.obGyneHistory.fullTerm !== null && data.obGyneHistory.fullTerm !== undefined && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Full Term</p>
                <p className="font-semibold">{data.obGyneHistory.fullTerm}</p>
              </div>
            )}
            {data.obGyneHistory.premature !== null && data.obGyneHistory.premature !== undefined && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Premature</p>
                <p className="font-semibold">{data.obGyneHistory.premature}</p>
              </div>
            )}
            {data.obGyneHistory.abortion !== null && data.obGyneHistory.abortion !== undefined && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Abortion</p>
                <p className="font-semibold">{data.obGyneHistory.abortion}</p>
              </div>
            )}
            {data.obGyneHistory.livingChildren !== null && data.obGyneHistory.livingChildren !== undefined && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Living Children</p>
                <p className="font-semibold">{data.obGyneHistory.livingChildren}</p>
              </div>
            )}
            {data.obGyneHistory.typeOfDelivery && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Type of Delivery</p>
                <p className="font-semibold">{data.obGyneHistory.typeOfDelivery}</p>
              </div>
            )}
            {data.obGyneHistory.hasPreEclampsia && (
              <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400">Complications</p>
                <p className="font-semibold">Pre-Eclampsia</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">No OB/GYN history recorded</p>
      )}
    </div>
  )
}
