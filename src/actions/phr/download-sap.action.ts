"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf } from "./utils/philhealth-pdf"

/**
 * Download SAP (Senior and PWD) Form - Empty for now
 * TODO: Implement field mapping once requirements are provided
 */
export const downloadSAPAction = withErrorHandling(async (userId?: string) => {
  if (!userId) throw new Error("User ID is required to generate SAP")

  // For now, just return empty PDF with no field mappings
  const map: { field: string; value: string }[] = []

  const pdf = await generatePdf(
    'PhilHealth_SAP_Form.pdf',
    map,
    undefined,
    `SAP_Form_${Date.now()}`,
    { textFontSize: 8 }
  )

  return { message: 'SAP PDF generated successfully (empty)', data: pdf }
})
