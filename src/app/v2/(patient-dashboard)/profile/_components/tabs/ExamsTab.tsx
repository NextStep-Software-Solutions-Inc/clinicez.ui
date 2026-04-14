'use client'

import { FlaskConical } from 'lucide-react'
import type { ExamsTabData } from '@/types/patient-profile-tabs'

type Props = { data: ExamsTabData }

function getExamStatusStyle(status: string | null) {
  if (!status) return { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' }
  const s = status.toLowerCase()
  if (s === 'good' || s === 'normal')
    return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
  if (s === 'fair' || s === 'moderate')
    return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
  if (s === 'poor' || s === 'abnormal')
    return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
  return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
}

function getVisionStatus(acuity: string | null): string {
  if (!acuity) return 'Not recorded'
  const acuityNum = parseFloat(acuity)
  if (isNaN(acuityNum)) return acuity
  if (acuityNum >= 1.0) return `${acuity} - Normal`
  if (acuityNum >= 0.8) return `${acuity} - Good`
  if (acuityNum >= 0.5) return `${acuity} - Fair`
  return `${acuity} - Poor`
}

const EXAM_STATUS_SUMMARY: Record<string, string> = {
  good: 'Physical examination is within normal limits',
  normal: 'All findings are normal',
  fair: 'Some findings observed - follow-up recommended',
  moderate: 'Moderate findings - medical attention advised',
  poor: 'Significant findings - consult healthcare provider',
  abnormal: 'Abnormal findings - requires evaluation',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  good: '#16a34a',
  normal: '#16a34a',
  fair: '#d97706',
  moderate: '#d97706',
  poor: '#dc2626',
  abnormal: '#dc2626',
}

export function ExamsTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-2"><FlaskConical className="w-5 h-5 text-teal-500" /> Physical Examinations</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Latest physical examination records</p>
        {data.physicalExaminations.length > 0 ? (
          <div className="space-y-3">
            {data.physicalExaminations.map((e, i) => {
              const statusInfo = getExamStatusStyle(e.status)
              const dateTime = new Date(e.createdAt)
              const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

              return (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                    </div>
                    {e.status && (
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color} ${statusInfo.bg}`}>
                        {e.status}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(e.visualAcuityLeft || e.visualAcuityRight) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                        {e.visualAcuityLeft && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                              Visual Acuity (Left)
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {getVisionStatus(e.visualAcuityLeft)}
                            </p>
                          </div>
                        )}
                        {e.visualAcuityRight && (
                          <div className="flex flex-col">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                              Visual Acuity (Right)
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {getVisionStatus(e.visualAcuityRight)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {e.status ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: STATUS_DOT_COLORS[e.status.toLowerCase()] ?? '#3b82f6' }}
                        />
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {EXAM_STATUS_SUMMARY[e.status.toLowerCase()] ?? `Examination status: ${e.status}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No additional details recorded for this examination
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No physical examinations recorded yet</p>
        )}
      </div>
    </div>
  )
}
