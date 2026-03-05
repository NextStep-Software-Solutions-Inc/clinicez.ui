'use client'

import type { ObGynTabData } from '@/types/patient-profile-tabs'

type Props = { data: ObGynTabData }

export function ObGynTab({ data }: Props) {
  if (data.gender?.toUpperCase() === 'MALE') {
    return (
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 OB/GYN History</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-5xl mb-3">♂️</div>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">OB/GYN records are not applicable</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Obstetric and gynecological history is specific to female patients.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glassmorphic-card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">👶 OB/GYN History</h3>
      {data.obGyneHistory ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.obGyneHistory.menarche && (
            <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
              <p className="text-xs text-slate-600 dark:text-slate-400">Menarche</p>
              <p className="font-semibold">{data.obGyneHistory.menarche} yrs</p>
            </div>
          )}
          {data.obGyneHistory.gravidity && (
            <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
              <p className="text-xs text-slate-600 dark:text-slate-400">Gravidity</p>
              <p className="font-semibold">{data.obGyneHistory.gravidity}</p>
            </div>
          )}
          {data.obGyneHistory.parity && (
            <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-white/5">
              <p className="text-xs text-slate-600 dark:text-slate-400">Parity</p>
              <p className="font-semibold">{data.obGyneHistory.parity}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">No OB/GYN history recorded</p>
      )}
    </div>
  )
}
