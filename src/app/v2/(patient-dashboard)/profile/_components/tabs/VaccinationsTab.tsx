'use client'

import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

type Props = { patient: SerializedPatientHealthRecordsResponse }

export function VaccinationsTab({ patient }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">💉 Vaccinations & Immunizations</h3>
        {patient.userVaccinations.length > 0 ? (
          <div className="space-y-3">
            {patient.userVaccinations.map((vaccination) => (
              <div key={vaccination.id} className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Vaccine</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{vaccination.vaccine}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Dose</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{vaccination.dose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Route</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{vaccination.route}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Date Given</p>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      {new Date(vaccination.dateGiven).toLocaleDateString()}
                    </p>
                  </div>
                  {vaccination.administeredBy && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Administered By</p>
                      <p className="text-slate-900 dark:text-white font-semibold">{vaccination.administeredBy}</p>
                    </div>
                  )}
                  {vaccination.notes && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Notes</p>
                      <p className="text-slate-700 dark:text-slate-300">{vaccination.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No vaccinations recorded</p>
        )}
      </div>
    </div>
  )
}
