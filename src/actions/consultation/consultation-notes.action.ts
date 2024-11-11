"use server"

import "server-only"

import prisma from "@lib/prisma"
import { getCachedSession } from "@actions/session.action";
import { getHPsAction } from "@actions/hp.actions";
import { hasCodeProperty } from "@lib/utils";

type UpsertConsultationNotePayload = {
  consultationTicketId: number;
  section: string;
  content: string;
  hpId: number
}
export const upsertConsultationNotesAction = async (data: UpsertConsultationNotePayload) => {
  let message = "Consultation notes updated successfully"
  try {
    const session = await getCachedSession()
    if(!session) throw new Error("User not authenticated.")
      
    const { consultationTicketId, section, content, hpId } = data
    const updatedNotes = await prisma.consultationNote.upsert({
      where: {
        unique_consultation_section: {
          consultationTicketId,
          section, 
          hpId
        },
        ConsultationTicket: {
          ConsultationTicketHPs: {
            some: {
              HealthCareProvider: {
                User: {
                  userId: session.user.sub
                }
              }
            }
          }
        }
      },
      create: { consultationTicketId, section, content, hpId },
      update: { content }
    })
    return {  status: true,  message: `${section} content updated successfully`, data: updatedNotes }
  } catch (error) {
    console.error(`Error upsert-ing consultation notes: ${error}`);
    message = "Failed to update consultation notes section content, either the consultation record does not exist or you do not have permission to update it"
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === 'P2025')  message = "Consultation record not found or you do not have permission to update it"
    return { status: false, message, data: null }
  }
} 

export type GetConsultationNotes = Awaited<ReturnType<typeof getConsultationNotesAction>>
export const getConsultationNotesAction = async (consultationTicketId: number) => {
  return await prisma.consultationNote.findMany({
    where: {  consultationTicketId  }
  })
}

export const upsertConsultationNotesSettingsAction = async (data: FormData) => {
  const session = await getCachedSession()

  try {
    if(!session) throw new Error("Session not found")
      
    const consultationTicketId = Number(data.get('consultationTicketId'))
    const hpId = Number(data.get('hpId'))
    data.delete('consultationTicketId')
    data.delete('hpId')
    await prisma.$transaction(async (prisma) => {
      const notes = Object.fromEntries(data)
      for(const [section, showOnPatient] of Object.entries(notes)) {
        const show = showOnPatient === "true"
        await prisma.consultationNote.upsert({
          where: {
            unique_consultation_section: { consultationTicketId,  section, hpId },
            ConsultationTicket: {
              ConsultationTicketHPs: {
                some: {
                  HealthCareProvider: {
                    User: {
                      userId: session.user.sub
                    }
                  }
                }
              }
            }
          },
          create: {
            consultationTicketId,
            section,
            content : "",
            hpId,
            showOnPatient:show
          },
          update: { 
            showOnPatient:show
          }
        })
      }
    })
    return { status: true,  message: `Consultation notes settings updated successfully` }
  } catch (error) {
    console.error(`Error upsert-ing consultation notes settings: ${error}`);
    let message = "Failed to update consultation notes section content, either the consultation record does not exist or you do not have permission to update it"
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === 'P2025') message = "Consultation record not found or you do not have permission to update it"
    return { status: false, message }
  }
  
} 