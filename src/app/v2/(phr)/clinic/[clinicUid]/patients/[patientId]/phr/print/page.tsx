import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getClinicPatientProfileAction } from '@/actions/clinics/get-clinic-patient-profile.action'
import { getCachedSession } from '@/actions/session.action'
import { PHRPrintContent, PHR_SECTIONS, type PHRSectionId } from '@/components/v2/phr/PHRPrintContent'
import { PHRAutoPrint } from '@/components/v2/phr/PHRAutoPrint'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

export const metadata: Metadata = {
  title: 'Patient Health Record — ClinicEZ',
  description: 'Comprehensive Patient Health Record',
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface ClinicPHRPrintPageProps {
  params: Promise<{ clinicUid: string; patientId: string }>
  searchParams: Promise<{ sections?: string; preview?: string }>
}

export default async function ClinicPatientPHRPrintPage({ params, searchParams }: ClinicPHRPrintPageProps) {
  const { clinicUid, patientId } = await params
  const { sections: sectionsParam, preview } = await searchParams

  const session = await getCachedSession()
  if (!session?.user?.sub) notFound()

  const numericPatientId = parseInt(patientId, 10)
  if (isNaN(numericPatientId)) notFound()

  const patient = await getClinicPatientProfileAction({ clinicUid, patientId: numericPatientId })
  if (!patient) notFound()

  const allSectionIds = PHR_SECTIONS.map(s => s.id)
  // Sanitize the sections param: limit length, allow only alphanumeric and commas
  const sanitized = sectionsParam?.slice(0, 256).replace(/[^a-z,]/g, '')
  const sections: PHRSectionId[] = sanitized && sanitized !== 'all'
    ? (sanitized.split(',').filter(s => allSectionIds.includes(s as PHRSectionId)) as PHRSectionId[])
    : allSectionIds

  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <>
      {/* Suppress auto-print in preview mode so iframe renders without a print dialog */}
      {preview !== '1' && <PHRAutoPrint />}
      <PHRPrintContent
        patient={patient as SerializedPatientHealthRecordsResponse}
        sections={sections}
        generatedAt={generatedAt}
      />
    </>
  )
}
