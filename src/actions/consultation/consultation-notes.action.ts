"use server"

import "server-only"

import prismaTenant from "@lib/prisma-tenant"
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';

export const upsertConsultationNotesAction = async (data: FormData) => {
  const consultationRecordId = parseInt(data.get('consultationRecordId') as string)
  const section = data.get('section') as string
  const content = data.get('content') as string
  try {
    const updatedNotes = await prismaTenant.noteContent.upsert({
      where: {
        unique_consultation_record_section: {
          consultationRecordId,
          section
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
      message: `Saving ${section} ...`,
      data: updatedNotes
    }
  } catch (error) {
    let message = "Failed to update consultation notes"
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
  return await prismaTenant.noteContent.findMany({
    where: {
      consultationRecordId: consultationRecordId,
    }
  })
}