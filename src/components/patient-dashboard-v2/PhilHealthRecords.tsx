'use client'

import { useState } from 'react'
import { Copy, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PhilHealthIDField } from './PhilHealthIDField'
import { PhilHealthCountCard } from './PhilHealthCountCard'
import { PhilHealthDependentCard } from './PhilHealthDependentCard'
import { PhilHealthPhotoDialog } from './PhilHealthPhotoDialog'
import { Button } from '@/components/ui/button'

interface PhilHealthDependent {
  id: number
  firstName: string
  middleName?: string
  lastName?: string
  suffix?: string
  relationship?: string
}

interface PhilHealthRecordType {
  id: number
  pin: string
  tin?: string | null
  philSysId?: string | null
  isActive: boolean
  createdAt: Date
  photoUrl?: string | null
  memberTypeId?: number | null
  PhilHealthMemberType?: { id: number; name: string } | null
  PhilHealthDependents?: PhilHealthDependent[] | null
}

interface PhilHealthRecordsProps {
  records: PhilHealthRecordType[]
}

export function PhilHealthRecords({ records }: PhilHealthRecordsProps) {
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null)

  if (records.length === 0) {
    return (
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🏥 PhilHealth Records</h3>
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">No PhilHealth records found</p>
      </div>
    )
  }

  return (
    <div className="glassmorphic-card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">🏥 PhilHealth Records</h3>
      <div className="space-y-4">
        {records.map((p, i) => (
          <div key={i} className="rounded-lg overflow-hidden bg-white/20 dark:bg-white/20 border border-slate-300/40 dark:border-white/20">
            {/* Header with Photo, Status and Member Type */}
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 p-4 border-b border-white/20 dark:border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">PhilHealth ID</p>
                  <div className="flex items-center gap-2 group">
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{p.pin}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(p.pin)
                        toast.success('PhilHealth ID copied to clipboard')
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300"
                      title="Copy PhilHealth ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  {p.photoUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setOpenPhotoUrl(p.photoUrl!)}
                    >
                      View PhilHealth ID photo
                    </Button>
                  )}
                  <div className="flex flex-col gap-2">
                    {p.isActive && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                    {p.PhilHealthMemberType ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                        {p.PhilHealthMemberType.name || 'Member'}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {/* PhilSys ID */}
                {p.philSysId && (
                  <PhilHealthIDField
                    label="PhilSys ID"
                    value={p.philSysId}
                    onCopy={() => {
                      navigator.clipboard.writeText(p.philSysId!)
                      toast.success('PhilSys ID copied to clipboard')
                    }}
                  />
                )}

                {/* TIN */}
                {p.tin && (
                  <PhilHealthIDField
                    label="TIN"
                    value={p.tin}
                    onCopy={() => {
                      navigator.clipboard.writeText(p.tin!)
                      toast.success('TIN copied to clipboard')
                    }}
                  />
                )}

                {/* Dependents Count */}
                {p.PhilHealthDependents && p.PhilHealthDependents.length > 0 && (
                  <PhilHealthCountCard label="Dependents" count={p.PhilHealthDependents.length} />
                )}
              </div>

              {/* Dependents List */}
              {p.PhilHealthDependents && p.PhilHealthDependents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-300 dark:border-white/20">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Dependents</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {p.PhilHealthDependents.map((dep, dIdx) => (
                      <PhilHealthDependentCard
                        key={dIdx}
                        firstName={dep.firstName}
                        middleName={dep.middleName}
                        lastName={dep.lastName}
                        relationship={dep.relationship}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Dialog - Rendered outside card */}
      <PhilHealthPhotoDialog 
      
        photoUrl={openPhotoUrl}
        isOpen={openPhotoUrl !== null}
        onClose={() => setOpenPhotoUrl(null)}
      />
    </div>
  )
}
