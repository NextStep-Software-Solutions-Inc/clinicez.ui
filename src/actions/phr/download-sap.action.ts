"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf } from "./utils/philhealth-pdf"
import { PHILHEALTH_ACCREDITATION_NUMBER, FACILITY_NAME } from "@/lib/contants"

/**
 * Download SAP (Senior and PWD) Form
 * Populates PhilHealth Accreditation Number (PAN) and Facility Name
 */
export const downloadSAPAction = withErrorHandling(async (userId?: string) => {
  if (!userId) throw new Error("User ID is required to generate SAP")

  // Map facility constant values to form fields
  const map: { field: string; value: string }[] = [
    { field: 'pan', value: PHILHEALTH_ACCREDITATION_NUMBER },
    { field: 'konsultaFacilityName', value: FACILITY_NAME },
  ]

  const pdf = await generatePdf(
    'PhilHealth_SAP_Form.pdf',
    map,
    undefined,
    `SAP_Form_${Date.now()}`,
    { textFontSize: 8 }
  )

  return { message: 'SAP PDF generated successfully', data: pdf }
})
