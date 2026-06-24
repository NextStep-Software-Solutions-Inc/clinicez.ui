'use client'

import { useState } from 'react'
import { FileText, ClipboardList, Stethoscope, Wand2, Loader2, CheckCircle2, Copy, CheckCircle, Hash } from 'lucide-react'
import { PhilHealthIDField }       from '@/components/patient-dashboard-v2/PhilHealthIDField'
import { PhilHealthCountCard }     from '@/components/patient-dashboard-v2/PhilHealthCountCard'
import { PhilHealthDependentCard } from '@/components/patient-dashboard-v2/PhilHealthDependentCard'
import { PhilHealthPhotoDialog }   from '@/components/patient-dashboard-v2/PhilHealthPhotoDialog'
import { Button }                  from '@/components/ui/button'
import { generateYakapEnlistmentNumbersAction } from '@/actions/clinics/konsulta-report.action'
import { toast }                   from 'sonner'
import type { InsuranceTabData }   from '@/types/patient-profile-tabs'

type Props = { data: InsuranceTabData }

export function InsuranceTab({ data }: Props) {
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null)
  const [caseNo,       setCaseNo]       = useState(data.konsultaHciCaseNo)
  const [profilingNo,  setProfilingNo]  = useState(data.konsultaHciProfilingTransNo)
  const [generating,   setGenerating]   = useState(false)

  const showNumbers = !!data.clinicPatientId                                          // numbers visible to all
  const canGenerate = data.isClinicStaffView && !!data.clinicPatientId && !!data.clinicUid // btn for staff only

  const philRecords = (data.philHealthRecords?.filter(r => r.PhilHealthMemberType) || []) as unknown as Array<{
    id: number; pin: string; tin?: string | null; philSysId?: string | null
    isActive: boolean; createdAt: string; photoUrl?: string | null
    memberTypeId?: number | null
    PhilHealthMemberType?: { id: number; name: string } | null
    PhilHealthDependents?: Array<{ id: number; firstName: string; middleName?: string; lastName?: string; suffix?: string; relationship?: string }> | null
  }>

  async function handleGenerate() {
    if (!data.clinicPatientId || !data.clinicUid) return
    setGenerating(true)
    const res = await generateYakapEnlistmentNumbersAction({
      clinicUid:       data.clinicUid,
      clinicPatientId: data.clinicPatientId,
    })
    setGenerating(false)
    if (res.status && res.data) {
      setCaseNo(res.data.hciCaseNo)
      setProfilingNo(res.data.hciEnlistmentTransNo)
      toast.success('Konsulta numbers generated successfully.')
    } else {
      toast.error(res.message ?? 'Failed to generate numbers.')
    }
  }

  return (
    <div className="space-y-6">

      {/* ─────────────── PhilHealth Card ─────────────── */}
      <div className="glassmorphic-card p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">🏥 PhilHealth Records</h3>

        {/* PhilHealth records list */}
        {philRecords.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400 text-center py-6">No PhilHealth records found</p>
        ) : (
          <div className="space-y-4">
            {philRecords.map((p, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-white/20 dark:bg-white/20 border border-slate-300/40 dark:border-white/20">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 p-4 border-b border-white/20 dark:border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">PhilHealth ID</p>
                      <div className="flex items-center gap-2 group">
                        <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{p.pin}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(p.pin); toast.success('PhilHealth ID copied') }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="Copy PhilHealth ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      {p.photoUrl && (
                        <Button variant="link" size="sm" onClick={() => setOpenPhotoUrl(p.photoUrl!)}>
                          View PhilHealth ID photo
                        </Button>
                      )}
                      <div className="flex flex-col gap-2">
                        {p.isActive && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                        {p.PhilHealthMemberType && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            {p.PhilHealthMemberType.name || 'Member'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {p.philSysId && (
                      <PhilHealthIDField label="PhilSys ID" value={p.philSysId}
                        onCopy={() => { navigator.clipboard.writeText(p.philSysId!); toast.success('PhilSys ID copied') }} />
                    )}
                    {p.tin && (
                      <PhilHealthIDField label="TIN" value={p.tin}
                        onCopy={() => { navigator.clipboard.writeText(p.tin!); toast.success('TIN copied') }} />
                    )}
                    {p.PhilHealthDependents && p.PhilHealthDependents.length > 0 && (
                      <PhilHealthCountCard label="Dependents" count={p.PhilHealthDependents.length} />
                    )}
                  </div>
                  {p.PhilHealthDependents && p.PhilHealthDependents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-300 dark:border-white/20">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Dependents</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {p.PhilHealthDependents.map((dep, dIdx) => (
                          <PhilHealthDependentCard key={dIdx}
                            firstName={dep.firstName} middleName={dep.middleName}
                            lastName={dep.lastName}   relationship={dep.relationship} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Konsulta Numbers (inside PhilHealth card) ── */}
        {showNumbers && (
          <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-teal-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Konsulta Patient Numbers
              </p>
            </div>

            {(caseNo || profilingNo) ? (
              /* At least one number exists — display both */
              <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm items-center">
                <span className="text-slate-500 dark:text-slate-400">Case No.</span>
                <div className="flex items-center gap-2">
                  {caseNo ? (
                    <>
                      <code className="rounded-md bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50 px-2.5 py-1 text-xs font-mono text-teal-800 dark:text-teal-200">
                        {caseNo}
                      </code>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic text-xs">Not yet generated</span>
                  )}
                </div>

                <span className="text-slate-500 dark:text-slate-400">Profiling Trans No.</span>
                <div className="flex items-center gap-2">
                  {profilingNo ? (
                    <>
                      <code className="rounded-md bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50 px-2.5 py-1 text-xs font-mono text-teal-800 dark:text-teal-200">
                        {profilingNo}
                      </code>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 italic text-xs">Not yet generated</span>
                  )}
                </div>
              </div>
            ) : canGenerate ? null : (
              /* No numbers and not a staff view — just show empty state */
              <p className="text-xs text-slate-400 dark:text-slate-600 italic">No Konsulta numbers assigned yet.</p>
            )}

            {/* Generate CTA — clinic staff only, shown when numbers are missing */}
            {canGenerate && (!caseNo || !profilingNo) && (
              <div className="rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    No Case No. &amp; Profiling Transaction No. assigned
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click the button to generate these Konsulta identifiers for this patient.
                  </p>
                </div>
                <Button
                  size="default"
                  className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
                  disabled={generating}
                  onClick={() => void handleGenerate()}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {generating ? 'Generating…' : 'Generate Case + Profiling Trans No.'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Dialog */}
      <PhilHealthPhotoDialog
        photoUrl={openPhotoUrl}
        isOpen={openPhotoUrl !== null}
        onClose={() => setOpenPhotoUrl(null)}
      />

      {/* ─────────────── Medical Certificates ─────────────── */}
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <FileText className="w-5 h-5 text-teal-500" /> Medical Certificates
        </h3>
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

      {/* ─────────────── Referral Slips ─────────────── */}
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <ClipboardList className="w-5 h-5 text-teal-500" /> Referral Slips
        </h3>
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

      {/* ─────────────── Procedure History ─────────────── */}
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <Stethoscope className="w-5 h-5 text-teal-500" /> Procedure History
        </h3>
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
