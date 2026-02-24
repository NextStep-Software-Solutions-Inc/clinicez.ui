import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getBookingClinicAction } from '@/actions/patient-dashboard/get-booking-clinic'
import BookAppointmentWizard from '@/components/patient-dashboard-v2/BookAppointmentWizard'

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: 'Request an appointment at your clinic',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ clinic?: string }>
}

export default async function BookAppointmentPage({ searchParams }: PageProps) {
  const { clinic: clinicUid } = await searchParams

  if (!clinicUid) {
    redirect('/v2/patient')
  }

  const result = await getBookingClinicAction({ clinicUid })

  if (!result.status || !result.data) {
    notFound()
  }

  const { clinicName, termsUrl, privacyUrl } = result.data

  return (
    <BookAppointmentWizard
      clinicUid={clinicUid}
      clinicName={clinicName}
      termsUrl={termsUrl}
      privacyUrl={privacyUrl}
    />
  )
}
