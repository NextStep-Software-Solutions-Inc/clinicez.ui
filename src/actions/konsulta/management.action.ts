"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"

export const getManagementActionsAction = withErrorHandling(async () => {
  const actions = await prisma.action.findMany({
    orderBy: { name: 'asc' }
  })
  return { message: "Success", data: actions }
})

export const getInterventionsAction = withErrorHandling(async (consultationTicketId: number) => {
  const interventions = await prisma.intervention.findMany({
    where: { consultationTicketId, deletedAt: null },
    include: {
      Action: true
    },
    orderBy: { createdAt: 'desc' }
  })
  return { message: "Success", data: interventions }
})

export const saveInterventionAction = withErrorHandling(async (data: {
  clinicId: number;
  hpId: number;
  consultationTicketId: number;
  actionId: number;
  details: string;
  othRemarks?: string;
}) => {
  const created = await prisma.intervention.create({
    data
  })
  
  // Fetch with action included
  const newIntervention = await prisma.intervention.findUnique({
    where: { id: created.id },
    include: { Action: true }
  })

  return { message: "Management plan added", data: newIntervention }
})

export const deleteInterventionAction = withErrorHandling(async (id: number) => {
  await prisma.intervention.update({
    where: { id },
    data: { deletedAt: new Date() }
  })
  return { message: "Management plan removed", data: null }
})
