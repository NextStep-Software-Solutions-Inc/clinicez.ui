import { getPatientBaseData } from '@/actions/patient-profile/get-patient-base-data'
import { notFound } from 'next/navigation'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function PatientProfilePage() {
  const patient = await getPatientBaseData()
  
  if (!patient) {
    notFound()
  }

  return <ProfileClient patient={patient} />
}
