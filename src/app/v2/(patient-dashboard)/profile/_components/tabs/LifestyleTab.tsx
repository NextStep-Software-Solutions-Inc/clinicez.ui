'use client'

import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

type Props = { patient: SerializedPatientHealthRecordsResponse }

export function LifestyleTab({ patient }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👤 Lifestyle & Personal History</h3>
        {patient.personalHistory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.personalHistory.smokingStatus && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Smoking</p>
                <p className="font-semibold text-slate-900 dark:text-white">{patient.personalHistory.smokingStatus}</p>
              </div>
            )}
            {patient.personalHistory.alcoholStatus && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Alcohol</p>
                <p className="font-semibold text-slate-900 dark:text-white">{patient.personalHistory.alcoholStatus}</p>
              </div>
            )}
            {patient.personalHistory.illicitDrugUse && (
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Drug Use</p>
                <p className="font-semibold text-slate-900 dark:text-white">{patient.personalHistory.illicitDrugUse}</p>
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
