import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getClinicPatientProfileAction } from '@/actions/clinics/get-clinic-patient-profile.action'
import { getCachedSession } from '@/actions/session.action'
import { PHRPrintContent, PHR_SECTIONS, type PHRSectionId, type PHRTheme } from '@/components/v2/phr/PHRPrintContent'
import { PHRAutoPrint } from '@/components/v2/phr/PHRAutoPrint'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

export const metadata: Metadata = {
  title: 'Patient Health Record — ClinicEZ',
  description: 'Comprehensive Patient Health Record',
}

export const dynamic = 'force-dynamic'
export const maxDuration = 20

interface ClinicPHRPrintPageProps {
  params: Promise<{ clinicUid: string; patientId: string }>
  searchParams: Promise<{ sections?: string; preview?: string; theme?: string }>
}

export default async function ClinicPatientPHRPrintPage({ params, searchParams }: ClinicPHRPrintPageProps) {
  const { clinicUid, patientId } = await params
  const { sections: sectionsParam, preview, theme: themeParam } = await searchParams

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

  const theme: PHRTheme = themeParam === 'minimal' ? 'minimal' : 'colorful'

  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const isPreview = preview === '1'

  return isPreview ? (
    <PHRPrintContent
      patient={patient as SerializedPatientHealthRecordsResponse}
      sections={sections}
      generatedAt={generatedAt}
      theme={theme}
      showClinicName={true}
    />
  ) : (
    <>
      <PHRAutoPrint />
      <PHRPrintContent
        patient={patient as SerializedPatientHealthRecordsResponse}
        sections={sections}
        generatedAt={generatedAt}
        theme={theme}
        showClinicName={true}
      />
    </>
  )
}
