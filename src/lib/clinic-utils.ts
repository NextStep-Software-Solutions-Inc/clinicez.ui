"use server"

import { isClinicHealthcareProviderAction, getClinicMembersAction } from "@/actions/clinics/clinic-member.action"
import { getCachedSession } from "@/actions/session.action"

// Check if the user is a healthcare provider in the clinic
export const isClinicHealthcareProvider = async (clinicUid: string) => {
  const session = await getCachedSession()
  if (!session) throw new Error("No session found")

  const userId = session.user.sub
  const isClinicMember = await isClinicHealthcareProviderAction(userId, clinicUid)
  return isClinicMember
}

// Check if the user is a clinic owner
export const isClinicOwner = async (clinicUid: string, userId?: string) => {
  const session = await getCachedSession()
  if (!session) throw new Error("No session found")

  const userToCheck = userId || session.user.sub

  try {
    const members = await getClinicMembersAction({
      clinicUid,
      userId: userToCheck,
      roleName: "owner"
    })

    return members.data && members.data.length > 0 &&
      members.data.some(member => member.status === "ACTIVE")
  } catch (error) {
    console.error("Error checking clinic owner status:", error)
    return false
  }
}