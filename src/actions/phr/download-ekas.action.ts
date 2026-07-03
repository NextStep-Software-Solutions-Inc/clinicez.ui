"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, resolvePreferredKonsultaProvider, PdfCheckboxMapping } from "./utils/philhealth-pdf"
import { getUserAction } from "@/actions/users/user.action"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { calculateAge } from "@/lib/utils"
import { getNextSequenceNumber } from "@/lib/sequence-generator"
import { formatTransactionNumber, formatAuthorizationCode } from "@/lib/format-sequence"

const upper = (v?: string | null) => v ? v.toUpperCase() : ""

type PhilHealthRecordLite = {
  id: number;
  memberType?: string;
  pin?: string | null;
}

function hasPhilHealthRecord(u: unknown): u is { PhilHealthRecord: PhilHealthRecordLite[] } {
  return !!u && typeof u === "object" && "PhilHealthRecord" in (u as Record<string, unknown>)
}

export const downloadEKASAction = withErrorHandling(async (
  userId: string,
  consultationTicketId?: number | null,
  clinicId?: number | null
): Promise<{ message: string; data: { pdfData: string; filename: string } }> => {
  if (!userId) throw new Error("User ID is required to generate Electronic Yakap Availment Slip")

  const userRes = await getUserAction(userId)
  const user = userRes.data
  if (!user) throw new Error("User profile not found. Please ensure you have a valid account.")

  // Get case number from consultation ticket if provided (lazy generation with storage)
  let finalCaseNumber: string | null = null
  let consultationTicket = null

  if (consultationTicketId) {
    consultationTicket = await prisma.consultationTicket.findUnique({
      where: { id: consultationTicketId },
      select: {
        clinicId: true,
        caseNumber: true,
        ekasTransactionNumber: true,
        ekasAuthorizationCode: true
      }
    })

    // Use stored case number if available
    finalCaseNumber = consultationTicket?.caseNumber || null

    // Use clinic from consultation if not provided
    if (!clinicId && consultationTicket?.clinicId) {
      clinicId = consultationTicket.clinicId
    }
  }

  // If no case number yet, generate one
  if (!finalCaseNumber) {
    const { generateTimestampCaseNumber } = await import("@/services/sequence-generator.service");
    finalCaseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT", clinicId || undefined);

    // Store it in the consultation ticket if linked
    if (consultationTicketId && consultationTicket) {
      try {
        await prisma.consultationTicket.update({
          where: { id: consultationTicketId },
          data: {
            caseNumber: finalCaseNumber,
            caseNumberGeneratedAt: new Date()
          }
        });
      } catch (error) {
        // If update fails, still use the generated number
        console.warn("Failed to store case number, but continuing:", error);
      }
    }
  }

  // Get transaction number and authorization code (lazy generation: generate once, store, reuse)
  let finalTransactionNumber: string | null = null
  let finalAuthCode: string | null = null

  if (consultationTicketId && consultationTicket) {
    // Check if already generated and stored
    finalTransactionNumber = consultationTicket.ekasTransactionNumber || null
    finalAuthCode = consultationTicket.ekasAuthorizationCode || null

    // If not, generate once and store
    if (!finalTransactionNumber || !finalAuthCode) {
      const transactionSeq = await getNextSequenceNumber('EKAS_TRANSACTION', clinicId || null)
      const authSeq = await getNextSequenceNumber('EKAS_AUTH_CODE', clinicId || null)

      finalTransactionNumber = formatTransactionNumber(clinicId || null, transactionSeq)
      finalAuthCode = formatAuthorizationCode(clinicId || null, authSeq)

      // Store in database for future use
      try {
        await prisma.consultationTicket.update({
          where: { id: consultationTicketId },
          data: {
            ekasTransactionNumber: finalTransactionNumber,
            ekasAuthorizationCode: finalAuthCode,
            ekasTransactionGeneratedAt: new Date()
          }
        })
      } catch (error) {
        console.warn("Failed to store EKAS transaction number, but continuing:", error)
      }
    }
  } else {
    // No consultation ticket - generate fresh (can't store)
    const transactionSeq = await getNextSequenceNumber('EKAS_TRANSACTION', clinicId || null)
    const authSeq = await getNextSequenceNumber('EKAS_AUTH_CODE', clinicId || null)

    finalTransactionNumber = formatTransactionNumber(clinicId || null, transactionSeq)
    finalAuthCode = formatAuthorizationCode(clinicId || null, authSeq)
  }

  // Get PhilHealth record
  let phr: PhilHealthRecordLite | undefined = hasPhilHealthRecord(user) ? user.PhilHealthRecord?.[0] : undefined
  if (!phr) {
    const fetched = await prisma.philHealthRecord.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
      select: { id: true, memberType: true, pin: true },
    })
    phr = fetched ?? undefined
  }

  // Get member type
  const memberType = phr?.memberType
    ? {
      name: phr.memberType === 'MM' ? 'Principal' : 'Dependent',
      category: phr.memberType === 'MM' ? 'DIRECT' : 'INDIRECT'
    }
    : null

  // Get preferred konsulta provider (clinic name)
  const providerName = await resolvePreferredKonsultaProvider(userId)

  // Fetch clinic settings to get PhilHealth accreditation number
  let philhealthAccreditationNumber = ''
  if (clinicId) {
    const clinicSetting = await prisma.clinicSetting.findUnique({
      where: { clinicId },
      select: { philhealthAccreditationNumber: true }
    })
    philhealthAccreditationNumber = clinicSetting?.philhealthAccreditationNumber || ''
  }

  // Calculate age
  const age = user.dob ? calculateAge(user.dob) : undefined

  // Get user's mobile number
  const mobileNumber = user.mobile

  // Determine if member or dependent based on member type category
  const isMember = memberType?.category === 'DIRECT'
  const isDependent = memberType?.category === 'INDIRECT'

  const textMappings = [
    { field: 'preferredKonsulTaProvider', value: upper(providerName) },
    { field: 'caseNumber', value: finalCaseNumber || '' },
    { field: 'hciAccreditationNumber', value: philhealthAccreditationNumber },
    { field: 'transactionNumber', value: finalTransactionNumber },
    { field: 'memberPin', value: phr?.pin || '' },
    { field: 'memberType', value: upper(memberType?.name) },
    { field: 'memberFullName', value: `${upper(user.firstName)} ${upper(user.middleName)} ${upper(user.lastName)}`.trim() },
    { field: 'memberAge', value: age?.toString() || '' },
    { field: 'mobileNumber', value: mobileNumber || '' },
    { field: 'authorizationTransactionCode', value: finalAuthCode },
  ]

  const checkboxMappings: PdfCheckboxMapping[] = [
    { field: 'checkboxTypeMember', condition: isMember },
    { field: 'checkboxTypeDependent', condition: isDependent },
  ]

  logger.info("Generating Electronic Yakap Availment Slip PDF", {
    userId,
    consultationTicketId,
    caseNumber: finalCaseNumber,
    transactionNumber: finalTransactionNumber,
    authCode: finalAuthCode
  })

  const result = await generatePdf(
    'PhilHealth_Electronic_Konsulta_Availment_Slip.pdf',
    textMappings,
    checkboxMappings
  )

  const fullName = `${user.lastName}_${user.firstName}`.replace(/\s+/g, '_')
  const filename = `EKAS_${fullName}_${Date.now()}.pdf`

  return {
    message: "Electronic Yakap Availment Slip generated successfully",
    data: {
      pdfData: result.pdfData,
      filename
    }
  }
})
