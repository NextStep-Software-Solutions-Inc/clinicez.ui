'use client'

import { Eye } from 'lucide-react'
import type { ExamsTabData } from '@/types/patient-profile-tabs'

type Props = { data: ExamsTabData }

function getVisionStatus(acuity: string | null): string {
  if (!acuity) return 'Not recorded'
  const acuityNum = parseFloat(acuity)
  if (isNaN(acuityNum)) return acuity
  if (acuityNum >= 1.0) return `${acuity} - Normal`
  if (acuityNum >= 0.8) return `${acuity} - Good`
  if (acuityNum >= 0.5) return `${acuity} - Fair`
  return `${acuity} - Poor`
}

export function ExamsTab({ data }: Props) {
  // Filter to only show vital signs that have visual acuity data
  const visualAcuityRecords = data.vitalSigns.filter(
    (v) => v.visualAcuityLeft || v.visualAcuityRight
  )

  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-2"><Eye className="w-5 h-5 text-teal-500" /> Visual Acuity</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Visual acuity records from vital sign measurements</p>
        {visualAcuityRecords.length > 0 ? (
          <div className="space-y-3">
            {visualAcuityRecords.map((v, i) => {
              const dateTime = new Date(v.dateTaken)
              const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

              return (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {v.visualAcuityLeft && (
                        <div className="flex flex-col">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                            Visual Acuity (Left)
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {getVisionStatus(v.visualAcuityLeft)}
                          </p>
                        </div>
                      )}
                      {v.visualAcuityRight && (
                        <div className="flex flex-col">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                            Visual Acuity (Right)
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {getVisionStatus(v.visualAcuityRight)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No visual acuity records found</p>
        )}
      </div>
    </div>
  )
}
