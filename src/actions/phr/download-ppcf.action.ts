"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, buildFullName, buildAddress, resolvePreferredKonsultaProvider } from "./utils/philhealth-pdf"
import { getUserAction } from "@/actions/users/user.action"

export const downloadPPCFAction = withErrorHandling(async (userId?: string) => {
  if (!userId) return { message: "User ID required", data: null }
  const userRes = await getUserAction(userId)
  const user = userRes.data
  if (!user) throw new Error("User not found")
  const primary = user.UserAddresses?.[0]
  const provider = await resolvePreferredKonsultaProvider(userId)
  const today = new Date().toISOString().split('T')[0]
  const texts = [
    { field: 'memberFullName', value: buildFullName({ firstName: user.firstName || undefined, middleName: user.middleName || undefined, lastName: user.lastName || undefined, nameExtension: user.suffix || undefined }) },
    { field: 'memberAddress', value: buildAddress(primary) },
    { field: 'preferredKonsultaProvider', value: provider },
    { field: 'Date_1', value: today },
    { field: 'Date_2', value: today },
  ]
  const pdf = await generatePdf('PhilHealth_Photo_Consent_Form.pdf', texts, undefined, `PPCF_${user.firstName || 'Member'}_${user.lastName || ''}`)
  return { message: 'PPCF populated successfully', data: pdf }
})
