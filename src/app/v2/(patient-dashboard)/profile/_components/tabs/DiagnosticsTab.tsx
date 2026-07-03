'use client'

import type { DiagnosticsTabData } from '@/types/patient-profile-tabs'
import KonsultaDiagnosticResultsPanel from '@/components/v2/consultations/KonsultaDiagnosticResultsPanel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FlaskConical } from 'lucide-react'

interface DiagnosticsTabProps {
  data: DiagnosticsTabData
  isClinicMode: boolean
  patientId?: number
  clinicPatientId?: number | null
}

export function DiagnosticsTab({ data, clinicPatientId }: DiagnosticsTabProps) {
  if (!clinicPatientId) return null

  // Ensure these values fall back to empty string if missing, as per user feedback
  const hciCaseNo = data.yakapEnlistment?.hciCaseNo || ''
  const hciTransNo = data.yakapEnlistment?.profilingTransNo || ''

  return (
    <div className="space-y-6">
      <Card className="glassmorphic-card">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Diagnostics</CardTitle>
              <CardDescription className="text-slate-500 text-sm mt-1">
                View and manage diagnostic exam results.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <KonsultaDiagnosticResultsPanel
            clinicPatientId={clinicPatientId}
            hciCaseNo={hciCaseNo}
            hciTransNo={hciTransNo}
            // consultationTicketId is intentionally omitted to run in "Profiling Mode"
          />
        </CardContent>
      </Card>
    </div>
  )
}
