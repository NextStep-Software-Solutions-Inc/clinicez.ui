'use client'

import { PhilHealthRecords } from '@/components/patient-dashboard-v2/PhilHealthRecords'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

type Props = { patient: SerializedPatientHealthRecordsResponse }

export function InsuranceTab({ patient }: Props) {
  return (
    <div className="space-y-6">
      <PhilHealthRecords records={(patient.philHealthRecords?.filter(r => r.PhilHealthMemberType) || []) as never} />

      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📜 Medical Certificates</h3>
        {patient.medicalCertificates.length > 0 ? (
          <div className="space-y-2">
            {patient.medicalCertificates.map((c, i) => (
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
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📋 Referral Slips</h3>
        {patient.referralSlips.length > 0 ? (
          <div className="space-y-2">
            {patient.referralSlips.map((r, i) => (
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
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚕️ Procedure History</h3>
        {patient.procedureHistory.length > 0 ? (
          <div className="space-y-2">
            {patient.procedureHistory.map((p, i) => (
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
