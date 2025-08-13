"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, formatIsoDate } from "./utils/philhealth-pdf"
import { getUserAndAddressAction } from "@/actions/users/user.action"

export const downloadPKRFAction = withErrorHandling(async (userId?: string) => {
  if (!userId) throw new Error("User ID required")
  const userRes = await getUserAndAddressAction(userId)
  if (!userRes.status || !userRes.data) throw new Error("User not found")
  const user = userRes.data
  const primary = user.UserAddresses?.[0]
  const map = [
    { field: 'dateRegistered', value: '' },
    { field: 'memberLastName', value: user.lastName?.toUpperCase() || 'N/A' },
    { field: 'membeFirstName', value: user.firstName?.toUpperCase() || 'N/A' },
    { field: 'memberMiddleName', value: user.middleName?.toUpperCase() || 'N/A' },
    { field: 'addressMunicipalityCity', value: primary?.city?.toUpperCase() || 'N/A' },
    { field: 'addressProvince', value: primary?.state?.toUpperCase() || 'N/A' },
    { field: 'memberDateOfBirth', value: formatIsoDate(user.dob) || 'N/A' },
    { field: 'mobileNumber', value: user.mobile || 'N/A' },
  ]
  const pdf = await generatePdf('PhilHealth_Konsulta_Registration_Form.pdf', map, undefined, `PKRF_Form_${user.firstName || 'Member'}_${user.lastName || ''}`)
  return { message: 'PKRF PDF generated successfully', data: pdf }
})
