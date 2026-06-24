"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"

export const savePhilhealthSoapAction = withErrorHandling(async (data: any) => {
  const { consultationTicketId, ...fields } = data

  const existing = await prisma.consultationKonsultaData.findUnique({
    where: { consultationTicketId }
  })

  if (existing) {
    const updated = await prisma.consultationKonsultaData.update({
      where: { consultationTicketId },
      data: fields
    })
    return { message: "PhilHealth SOAP Data updated", data: updated }
  } else {
    // We shouldn't reach here since Phase 0 or Ticket creation should handle it,
    // but just in case.
    const ticket = await prisma.consultationTicket.findUnique({ where: { id: consultationTicketId }})
    if (!ticket) throw new Error("Ticket not found")
    
    const created = await prisma.consultationKonsultaData.create({
      data: {
        consultationTicketId,
        clinicId: ticket.clinicId,
        patientId: ticket.clinicPatientId || 0,
        patientType: "MEMBER",
        effYear: String(new Date().getFullYear()),
        ...fields
      }
    })
    return { message: "PhilHealth SOAP Data created", data: created }
  }
})
