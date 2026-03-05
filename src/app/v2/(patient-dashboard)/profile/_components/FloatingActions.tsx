'use client'

import { useRouter } from 'next/navigation'
import { Edit2, FolderOpen, ClipboardList } from 'lucide-react'
import { DownloadPHRButton } from '@/components/v2/phr/DownloadPHRButton'
import { PatientAIInsightButton } from '@/components/v2/patients/PatientAIInsightButton'

interface FloatingActionsProps {
  patientName: string
  editProfileHref: string | null | undefined
  filesHref: string | null | undefined
  filesButtonLabel: string
  appointmentsHref: string | null | undefined
  downloadPHRHref: string
  aiInsightConfig?: { patientId: number; clinicId?: number }
}

export function FloatingActions({
  patientName,
  editProfileHref,
  filesHref,
  filesButtonLabel,
  appointmentsHref,
  downloadPHRHref,
  aiInsightConfig,
}: FloatingActionsProps) {
  const router = useRouter()

  if (editProfileHref === null) return null

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 md:gap-3">
      {appointmentsHref && (
        <button
          onClick={() => router.push(appointmentsHref)}
          className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-green-600 to-teal-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden lg:inline">Appts &amp; Consultations</span>
        </button>
      )}
      {filesHref !== null && (
        <button
          onClick={() => router.push(filesHref ?? '/v2/patient/files')}
          className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden lg:inline">{filesButtonLabel}</span>
        </button>
      )}
      <DownloadPHRButton printHref={downloadPHRHref} patientName={patientName} />
      {aiInsightConfig && (
        <PatientAIInsightButton
          patientId={aiInsightConfig.patientId}
          clinicId={aiInsightConfig.clinicId}
          patientName={patientName}
          size="default"
          iconOnly
          className="shadow-lg"
        />
      )}
      <button
        onClick={() => router.push(editProfileHref ?? '/v2/profile/edit')}
        className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
      >
        <Edit2 className="w-4 h-4" />
        <span className="hidden lg:inline">Edit Profile</span>
      </button>
    </div>
  )
}
