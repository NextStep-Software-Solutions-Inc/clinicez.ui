'use client'

import { FileText, ClipboardList, Stethoscope } from 'lucide-react'
import { PhilHealthRecords } from '@/components/patient-dashboard-v2/PhilHealthRecords'
import { PhilHealthYakapCard } from '@/components/patient-dashboard-v2/PhilHealthYakapCard'
import type { InsuranceTabData } from '@/types/patient-profile-tabs'

type Props = { 
  data: InsuranceTabData
  isClinicMode?: boolean
  patientId?: number 
  clinicPatientId?: number | null
}

export function InsuranceTab({ data, isClinicMode = false, patientId, clinicPatientId }: Props) {
  const philHealthRecord = data.philHealthRecords?.[0] as any

  return (
    <div className="space-y-6">
      <PhilHealthRecords records={(data.philHealthRecords?.filter(r => r.memberType) || []) as never} />
      
      {clinicPatientId && (
        <PhilHealthYakapCard 
          clinicPatientId={clinicPatientId} 
          isClinicMode={isClinicMode} 
          philHealthRecord={philHealthRecord}
        />
      )}

      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><FileText className="w-5 h-5 text-teal-500" /> Medical Certificates</h3>
        {data.medicalCertificates.length > 0 ? (
          <div className="space-y-2">
            {data.medicalCertificates.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">{c.serialNumber}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Created: {new Date(c.createdAt).toLocaleDateString()} | By: {c.createdBy}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No medical certificates found</p>
        )}
      </div>

      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><ClipboardList className="w-5 h-5 text-teal-500" /> Referral Slips</h3>
        {data.referralSlips.length > 0 ? (
          <div className="space-y-2">
            {data.referralSlips.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">Referred to: {r.referredTo || 'N/A'}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Reason: {r.reason || 'N/A'}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Date: {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No referral slips found</p>
        )}
      </div>

      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Stethoscope className="w-5 h-5 text-teal-500" /> Procedure History</h3>
        {data.procedureHistory.length > 0 ? (
          <div className="space-y-2">
            {data.procedureHistory.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(p.usedAt).toLocaleDateString()}
                </p>
                {p.procedureName && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">{p.procedureName}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No procedures recorded</p>
        )}
      </div>
    </div>
  )
}
