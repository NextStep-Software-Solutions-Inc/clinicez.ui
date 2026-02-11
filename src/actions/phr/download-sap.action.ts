"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf } from "./utils/philhealth-pdf"
import prisma from "@/lib/prisma"

/**
 * Download SAP (Senior and PWD) Form
 * Populates PhilHealth Accreditation Number (PAN) and Facility Name from clinic settings
 */
export const downloadSAPAction = withErrorHandling(async (
  userId?: string,
  consultationTicketId?: number | null,
  clinicId?: number | null
) => {
  if (!userId) throw new Error("User ID is required to generate SAP")

  // Get clinic ID from consultation ticket if provided
  if (consultationTicketId && !clinicId) {
    const consultationTicket = await prisma.consultationTicket.findUnique({
      where: { id: consultationTicketId },
      select: { clinicId: true }
    })
    clinicId = consultationTicket?.clinicId || null
  }

  // If still no clinic ID, try to get from user's clinic patient records
  if (!clinicId) {
    const clinicPatient = await prisma.clinicPatient.findFirst({
      where: {
        User: { userId },
        isActive: true,
        deletedAt: null
      },
      select: { clinicId: true },
      orderBy: { createdAt: 'desc' }
    })
    clinicId = clinicPatient?.clinicId || null
  }

  // Fetch clinic settings to get PhilHealth information
  let philhealthAccreditationNumber = ''
  let facilityName = ''

  if (clinicId) {
    const clinicSetting = await prisma.clinicSetting.findUnique({
      where: { clinicId },
      select: {
        philhealthAccreditationNumber: true,
        facilityName: true
      }
    })

    philhealthAccreditationNumber = clinicSetting?.philhealthAccreditationNumber || ''
    facilityName = clinicSetting?.facilityName || ''
  }

  // Map facility values to form fields
  const map: { field: string; value: string }[] = [
    { field: 'pan', value: philhealthAccreditationNumber },
    { field: 'konsultaFacilityName', value: facilityName },
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
