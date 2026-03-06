'use client'

import type { AllergiesTabData } from '@/types/patient-profile-tabs'

type Props = { data: AllergiesTabData }

export function AllergiesTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">⚠️ Allergies</h3>
        {data.userAllergies.length > 0 ? (
          <div className="space-y-3">
            {data.userAllergies.map((allergy) => (
              <div key={allergy.id} className="p-4 rounded-lg bg-red-50/30 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Allergen</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{allergy.allergen}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Reaction</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{allergy.reaction}</p>
                  </div>
                  {allergy.notes && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Notes</p>
                      <p className="text-slate-700 dark:text-slate-300">{allergy.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No allergies recorded</p>
        )}
      </div>
    </div>
  )
}
