"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, buildFullName, buildAddress, resolvePreferredKonsultaProvider } from "./utils/philhealth-pdf"
import { getUserAction } from "@/actions/users/user.action"
import { PrimaryAddress, hasUserAddresses } from "@/lib/utils/philhealth"

export const downloadPPCFAction = withErrorHandling(async (userId?: string) => {
  if (!userId) return { message: "User ID required", data: null }
  const userRes = await getUserAction(userId)
  const user = userRes.data
  if (!user) throw new Error("User not found")
  const primary: PrimaryAddress | undefined = hasUserAddresses(user) ? user.UserAddresses?.[0] : undefined
  const provider = await resolvePreferredKonsultaProvider(userId)
  const today = new Date().toISOString().split('T')[0]
  // Address splitting logic: line 1 = first non-empty of subdivision/street/apartmentUnit; line 2 = barangay, city, state joined
  let addressLine1 = ''
  let addressLine2 = ''
  if (primary) {
    addressLine1 = [primary.subdivision, primary.street, primary.apartmentUnit].find(v => v && v.trim()) || ''
    const trail = [primary.barangay, primary.city, primary.state].filter(v => v && v.trim())
    addressLine2 = trail.join(', ')
  }
  const texts = [
    { field: 'memberFullName', value: buildFullName({ firstName: user.firstName || undefined, middleName: user.middleName || undefined, lastName: user.lastName || undefined, nameExtension: user.suffix || undefined }).toUpperCase() },
    { field: 'memberAddress_1', value: addressLine1 ? addressLine1.toUpperCase() : undefined },
    { field: 'memberAddress_2', value: addressLine2 ? addressLine2.toUpperCase() : undefined },
    { field: 'preferredKonsultaProvider', value: provider?.toUpperCase() },
    { field: 'Date_1', value: today },
    { field: 'Date_2', value: today },
  ]
  const pdf = await generatePdf('PhilHealth_Photo_Consent_Form.pdf', texts, undefined, `PPCF_${user.firstName || 'Member'}_${user.lastName || ''}`)
  return { message: 'PPCF populated successfully', data: pdf }
})
