'use client'

import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

type Props = { patient: SerializedPatientHealthRecordsResponse }

export function MedicalTab({ patient }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glassmorphic-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🏥 Medical History</h3>
          {patient.medicalHistories.length > 0 ? (
            <div className="space-y-2">
              {patient.medicalHistories.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                  <p className="font-semibold text-slate-900 dark:text-white">{h.condition}</p>
                  {h.details && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{h.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">No medical history</p>
          )}
        </div>

        <div className="glassmorphic-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👨‍👩‍👧 Family History</h3>
          {patient.familyMedicalHistories.length > 0 ? (
            <div className="space-y-2">
              {patient.familyMedicalHistories.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
                  <p className="font-semibold text-slate-900 dark:text-white">{h.condition}</p>
                  {h.details && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{h.details}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 text-center py-8">No family history</p>
          )}
        </div>
      </div>

      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚕️ Surgical History</h3>
        {patient.surgicalHistories.length > 0 ? (
          <div className="space-y-3">
            {patient.surgicalHistories.map((surgery) => (
              <div key={surgery.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                <p className="font-semibold text-slate-900 dark:text-white">{surgery.operationName}</p>
                {surgery.operationDate && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    📅 {new Date(surgery.operationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                {surgery.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">📝 {surgery.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No surgical procedures recorded</p>
        )}
      </div>
    </div>
  )
}
