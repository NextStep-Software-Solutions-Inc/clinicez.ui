'use client'

import { Stethoscope, Users, Scissors, Calendar, FileText } from 'lucide-react'
import type { MedicalTabData } from '@/types/patient-profile-tabs'

type Props = { data: MedicalTabData }

export function MedicalTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glassmorphic-card p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Stethoscope className="w-5 h-5 text-teal-500" /> Medical History</h3>
          {data.medicalHistories.length > 0 ? (
            <div className="space-y-2">
              {data.medicalHistories.map((h, i) => (
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
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Users className="w-5 h-5 text-teal-500" /> Family History</h3>
          {data.familyMedicalHistories.length > 0 ? (
            <div className="space-y-2">
              {data.familyMedicalHistories.map((h, i) => (
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
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Scissors className="w-5 h-5 text-teal-500" /> Surgical History</h3>
        {data.surgicalHistories.length > 0 ? (
          <div className="space-y-3">
            {data.surgicalHistories.map((surgery) => (
              <div key={surgery.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                <p className="font-semibold text-slate-900 dark:text-white">{surgery.operationName}</p>
                {surgery.operationDate && (
                  <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" /> {new Date(surgery.operationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                {surgery.notes && (
                  <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-2"><FileText className="w-3 h-3 shrink-0" /> {surgery.notes}</p>
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
