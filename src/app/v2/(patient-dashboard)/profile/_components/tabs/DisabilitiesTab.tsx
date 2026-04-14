'use client'

import { Accessibility } from 'lucide-react'
import type { DisabilitiesTabData } from '@/types/patient-profile-tabs'

type Props = { data: DisabilitiesTabData }

export function DisabilitiesTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Accessibility className="w-5 h-5 text-teal-500" /> Disabilities &amp; Illnesses</h3>
        {data.userDisabilities.length > 0 ? (
          <div className="space-y-3">
            {data.userDisabilities.map((disability) => (
              <div key={disability.id} className="p-4 rounded-lg bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200/30 dark:border-purple-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Disability/Illness</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{disability.disability}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Severity</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{disability.severity}</p>
                  </div>
                  {disability.dateDiagnosed && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Date Diagnosed</p>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {new Date(disability.dateDiagnosed).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Managed</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{disability.isManaged ? 'Yes' : 'No'}</p>
                  </div>
                  {disability.diagnosedBy && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Diagnosed By</p>
                      <p className="text-slate-900 dark:text-white font-semibold">{disability.diagnosedBy}</p>
                    </div>
                  )}
                  {disability.reason && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Reason</p>
                      <p className="text-slate-700 dark:text-slate-300">{disability.reason}</p>
                    </div>
                  )}
                  {disability.notes && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Notes</p>
                      <p className="text-slate-700 dark:text-slate-300">{disability.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No disabilities recorded</p>
        )}
      </div>
    </div>
  )
}
