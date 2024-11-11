"use server"

import "server-only"

import prismaTenant from "@lib/prisma-tenant"
import { getCachedSession } from "@actions/session.action";
import { getHPsAction } from "@actions/hp.actions";
import { hasCodeProperty } from "@lib/utils";

export const upsertConsultationNotesAction = async (data: FormData) => {
  const session = await getCachedSession()
  try {

    if(!session) throw new Error("User not authenticated.")
      
    const myHps = await getHPsAction({userId: session.user.sub})
    const consultationTicketId = parseInt(data.get('consultationTicketId') as string)
    const section = data.get('section') as string
    const content = data.get('content') as string

    const updatedNotes = await prismaTenant.consultationNote.upsert({
      where: {
        unique_consultation_section: {
          consultationTicketId,
          section, 
        },
        ConsultationTicket: {
          ConsultationTicketAuthors: {
            some: {
              hpId: {
                in: myHps.map(hp => hp.id.toString())
              }
            }
          }
        }
      },
      create: {
        consultationTicketId,
        section,
        content,
      },
      update: { 
        content,
      }
    })
    return {
      status: true,
      message: `${section} content updated successfully`,
      data: updatedNotes
    }
  } catch (error) {
    let message = "Failed to update consultation notes section content, either the consultation record does not exist or you do not have permission to update it"
    if(hasCodeProperty(error) && error.code === 'P2025')  message = "Consultation record not found or you do not have permission to update it"
    return { status: false, message, data: null }
  }
  
} 

export type GetConsultationNotes = Awaited<ReturnType<typeof getConsultationNotesAction>>
export const getConsultationNotesAction = async (consultationTicketId: number) => {
  return await prismaTenant.consultationNote.findMany({
    where: {
      consultationTicketId,
    }
  })
}

export const upsertConsultationNotesSettingsAction = async (data: FormData) => {
  const session = await getCachedSession()

  try {
    if(!session) throw new Error("Session not found")
      
    const myHps = await getHPsAction({userId: session.user.sub})
    const consultationTicketId = Number(data.get('consultationTicketId'))
    data.delete('consultationTicketId')
    await prismaTenant.$transaction(async (prisma) => {
      const notes = Object.fromEntries(data)
      for(const [section, showOnPatient] of Object.entries(notes)) {
        const show = showOnPatient === "true"
        await prisma.consultationNote.upsert({
          where: {
            unique_consultation_section: {
              consultationTicketId,
              section, 
            },
            ConsultationTicket: {
              ConsultationTicketAuthors: {
                some: {
                  hpId: {
                    in: myHps.map(hp => hp.id.toString())
                  }
                }
              }
            }
          },
          create: {
            consultationTicketId,
            section,
            content : "",
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
    let message = "Failed to update consultation notes section content, either the consultation record does not exist or you do not have permission to update it"
    if(hasCodeProperty(error) && error.code === 'P2025') message = "Consultation record not found or you do not have permission to update it"
    return { status: false, message }
  }
  
} 