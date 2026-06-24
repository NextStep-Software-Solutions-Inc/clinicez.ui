"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { getUserAction } from "@/actions/users/user.action"
import prisma from "@/lib/prisma"
import { renderToBuffer } from '@react-pdf/renderer'
import React from "react"
import { EPressPdfDocument } from "@/components/v2/phr/EPressPdfDocument"
import { calculateAge } from "@/lib/utils"

export const downloadEPressAction = withErrorHandling(async (
  userId: string,
  consultationTicketId: number,
  clinicId?: number | null
): Promise<{ message: string; data: { pdfData: string; filename: string } }> => {
  if (!userId) throw new Error("User ID is required to generate Electronic Prescription Slip")

  const userRes = await getUserAction(userId)
  const user = userRes.data
  if (!user) throw new Error("User profile not found. Please ensure you have a valid account.")

  const consultationTicket = await prisma.consultationTicket.findUnique({
    where: { id: consultationTicketId },
    include: {
      Clinic: {
        include: {
          ClinicSetting: true
        }
      },
      Prescriptions: {
        include: {
          Medicines: true
        }
      }
    }
  })

  if (!consultationTicket) throw new Error("Consultation not found.")

  const age = user.dob ? calculateAge(user.dob) : undefined

  // Generate PDF buffer
  const pdfBuffer = await renderToBuffer(
    React.createElement(EPressPdfDocument as any, {
      patient: {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        age,
        gender: user.gender,
      },
      clinic: {
        name: consultationTicket.Clinic?.name || "",
        accreditationNumber: consultationTicket.Clinic?.ClinicSetting?.philhealthAccreditationNumber || "",
        address: consultationTicket.Clinic?.ClinicSetting?.facilityName || ""
      },
      prescriptions: consultationTicket.Prescriptions.flatMap(p => p.Medicines.map(m => ({
        genericName: m.genericName || m.name || "",
        brandName: m.brandName || "",
        dosage: m.dosage || "",
        frequency: m.frequency || "",
        duration: m.duration?.toString() || "",
        quantity: m.qty?.toString() || ""
      }))),
      date: new Date()
    }) as any
  )

  const base64 = Buffer.from(pdfBuffer).toString("base64")
  const fullName = `${user.lastName}_${user.firstName}`.replace(/\s+/g, '_')
  const filename = `ePresS_${fullName}_${Date.now()}.pdf`

  return {
    message: "Electronic Prescription Slip generated successfully",
    data: {
      pdfData: base64,
      filename
    }
  }
})
