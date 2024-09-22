"use server"

import "server-only"

import prismaTenant from "@lib/prisma-tenant"
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';
import { getCachedSession } from "@actions/session.action";

export const upsertConsultationNotesAction = async (data: FormData) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }
  const consultationRecordId = parseInt(data.get('consultationRecordId') as string)
  const section = data.get('section') as string
  const content = data.get('content') as string
  try {
    const updatedNotes = await prismaTenant.consultationNote.upsert({
      where: {
        unique_consultation_record_section: {
          consultationRecordId,
          section, 
        },
        ConsultationRecord: {
          createdBy: session.user.email
        }
      },
      create: {
        consultationRecordId,
        section,
        content
      },
      update: { content }
    })
    return {
      status: true,
      message: `Saving ...`,
      data: updatedNotes
    }
  } catch (error) {
    let message = "Failed to update consultation notes section content, either the consultation record does not exist or you do not have permission to update it"
    if(error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      message = error.meta?.cause as string ?? message
    }
    return {
      status: false,
      message,
      data: null
    }
  }
  
} 

export type GetConsultationNotes = Awaited<ReturnType<typeof getConsultationNotesAction>>
export const getConsultationNotesAction = async (consultationRecordId: number) => {
  return await prismaTenant.consultationNote.findMany({
    where: {
      consultationRecordId: consultationRecordId,
    }
  })
}