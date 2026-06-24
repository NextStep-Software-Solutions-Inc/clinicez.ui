"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"

export const getNcdAssessmentAction = withErrorHandling(async (consultationTicketId: number) => {
  const ncd = await prisma.konsultaNcdQuestionnaire.findFirst({
    where: { consultationTicketId }
  })
  return { message: "Success", data: ncd }
})

export const saveNcdAssessmentAction = withErrorHandling(async (data: any) => {
  const { id, userId, consultationTicketId, clinicId, ...fields } = data

  if (id) {
    const updated = await prisma.konsultaNcdQuestionnaire.update({
      where: { id },
      data: fields
    })
    return { message: "NCD Assessment updated", data: updated }
  } else {
    const created = await prisma.konsultaNcdQuestionnaire.create({
      data: {
        userId,
        consultationTicketId,
        clinicId,
        ...fields
      }
    })
    return { message: "NCD Assessment created", data: created }
  }
})
