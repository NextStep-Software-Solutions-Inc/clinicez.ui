import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPatientSelfHistoryAction } from '@/actions/patient-dashboard/get-self-history'
import PatientHistoryClient from '@/components/patient-dashboard-v2/PatientHistoryClient'

export const metadata: Metadata = {
  title: 'Appointments & Consultations',
  description: 'View all your appointments and consultation notes',
}

export const dynamic = 'force-dynamic'

export default async function PatientAppointmentsConsultationsPage() {
  const result = await getPatientSelfHistoryAction()

  if (!result.status || !result.data) {
    notFound()
  }

  const { patient, appointments, consultationTickets } = result.data

  return (
    <PatientHistoryClient
      patientName={patient.fullName || 'You'}
      appointments={appointments}
      consultationTickets={consultationTickets}
    />
  )
}
