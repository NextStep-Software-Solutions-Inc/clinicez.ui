import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBookingClinicAction } from '@/actions/patient-dashboard/get-booking-clinic'
import { checkIsClinicPatientAction } from '@/actions/clinics/clinic-patient.action'
import BookAppointmentWizard from '@/components/patient-dashboard-v2/BookAppointmentWizard'
import SelectClinicPage from './SelectClinicPage'

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Request an appointment at your clinic',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ clinic?: string; hp?: string }>
}

export default async function BookAppointmentPage({ searchParams }: PageProps) {
  const { clinic: clinicUid, hp: hpParam } = await searchParams

  if (!clinicUid) {
    return <SelectClinicPage />
  }

  const [result, isPatient] = await Promise.all([
    getBookingClinicAction({ clinicUid }),
    checkIsClinicPatientAction(clinicUid),
  ])

  if (!result.status || !result.data) {
    notFound()
  }

  const { clinicName, termsUrl, privacyUrl } = result.data
  const parsedHpId = hpParam ? Number.parseInt(hpParam, 10) : NaN
  const preferredHpId = Number.isFinite(parsedHpId) && parsedHpId > 0 ? parsedHpId : undefined

  return (
    <BookAppointmentWizard
      clinicUid={clinicUid}
      clinicName={clinicName}
      termsUrl={termsUrl}
      privacyUrl={privacyUrl}
      preferredHpId={preferredHpId}
      isInitialPatient={isPatient}
    />
  )
}
