import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { notFound } from 'next/navigation'
import ProfileClient from './profile-client'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

export const dynamic = 'force-dynamic'

export default async function PatientProfilePage() {
  const patient = await getPatientHealthRecords()
  
  if (!patient) {
    notFound()
  }

  return <ProfileClient patient={patient as SerializedPatientHealthRecordsResponse} />
}
