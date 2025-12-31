"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, formatIsoDate } from "./utils/philhealth-pdf"
import { getUserAction } from "@/actions/users/user.action"
import prisma from "@/lib/prisma"

type PrimaryAddress = { city?: string | null; state?: string | null; barangay?: string | null }
function hasUserAddresses(u: unknown): u is { UserAddresses?: PrimaryAddress[] } {
  return !!u && typeof u === "object" && "UserAddresses" in (u as Record<string, unknown>)
}
type PhilHealthRecordLite = { pin?: string | null; philSysId?: string | null; tin?: string | null }
function hasPhilHealthRecord(u: unknown): u is { PhilHealthRecord: PhilHealthRecordLite[] } {
  return !!u && typeof u === "object" && "PhilHealthRecord" in (u as Record<string, unknown>)
}

export const downloadPKRFAction = withErrorHandling(async (userId?: string) => {
  if (!userId) throw new Error("User ID is required to generate PKRF")

  const userRes = await getUserAction(userId)
  if (!userRes.status || !userRes.data) throw new Error("User profile not found. Please ensure you have a valid account.")

  const user = userRes.data
  const primary: PrimaryAddress | undefined = hasUserAddresses(user) ? user.UserAddresses?.[0] : undefined
  let phr = hasPhilHealthRecord(user) ? user.PhilHealthRecord?.[0] : undefined
  if (!phr && user.id) {
    const fetched = await prisma.philHealthRecord.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
      select: { pin: true, philSysId: true, tin: true },
    })
    phr = fetched ?? undefined
  }
  const map = [
    { field: 'dateRegistered', value: formatIsoDate(new Date()) },
    { field: 'memberLastName', value: user.lastName?.toUpperCase() || 'N/A' },
    { field: 'membeFirstName', value: user.firstName?.toUpperCase() || 'N/A' }, // Note: PDF has typo in field name
    { field: 'memberMiddleName', value: user.middleName?.toUpperCase() || 'N/A' },

    { field: 'addressMunicipalityCity', value: primary?.city?.toUpperCase() || 'N/A' },
    { field: 'addressProvince', value: primary?.state?.toUpperCase() || 'N/A' },
    { field: 'addressBarangay', value: primary?.barangay?.toUpperCase() || 'N/A' },

    { field: 'memberPhilSysID', value: phr?.philSysId || 'N/A' },
    // { field: 'memberTin', value: phr?.tin || 'N/A' },

    { field: 'memberDateOfBirth', value: formatIsoDate(user.dob) || 'N/A' },
    { field: 'mobileNumber', value: user.mobile || 'N/A' },

    { field: 'memberPin', value: phr?.pin || 'N/A' }
  ]
  const pdf = await generatePdf(
    'PhilHealth_Konsulta_Registration_Form.pdf',
    map,
    undefined,
    `PKRF_Form_${user.firstName || 'Member'}_${user.lastName || ''}`,
    { textFontSize: 8 }
  )
  return { message: 'PKRF PDF generated successfully', data: pdf }
})
