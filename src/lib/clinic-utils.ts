"use server"

import { isClinicHealthcareProviderAction } from "@/actions/clinics/clinic-member.action"
import { getCachedSession } from "@/actions/session.action"

// Check if the user is a healthcare provider in the clinic
export const isClinicHealthcareProvider = async (clinicUid: string) => {
  const session = await getCachedSession()
  if (!session) throw new Error("No session found")

  const userId = session.user.sub
  const isClinicMember = await isClinicHealthcareProviderAction(userId, clinicUid)
  return isClinicMember
}