"use server";
import 'server-only'

import prismaTenant from '@lib/prisma-tenant';
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';
import { getCachedSession } from '@actions/session.action';
import { cache } from 'react';

type CreateConsultationTicketPayload = {
    systemId: number;
    appointmentId?: number;
    subject?: string;
    orgUid: string;
}

export const createConsultationTicketAction = async ({systemId, appointmentId, orgUid, subject}: CreateConsultationTicketPayload) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  const consultationTicket = await prismaTenant.consultationTicket.create({
    data: {
      systemId,
      appointmentId,
      subject,
      orgUid,
      createdBy: session.user.email,
      ConsultationTicketAttribute:{
        create: {
        }
      }
    }
  })
  return {
    status: true,
    message: "Consultation Record created successfully",
    data: consultationTicket
  }
}

export type GetConsultationTicket = Awaited<ReturnType<typeof getConsultationTicketAction>>;
export const getConsultationTicketAction = cache(async (consultationId: number, orgUid: string) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }


  const consultationTicket = await prismaTenant.consultationTicket.findUnique({
    where: { id: consultationId, orgUid },
    select: {
      id: true,
      subject: true,
      appointmentId: true,
      orgUid: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      isArchived: true,
      System: {
        select: {
          id: true,
          name: true
        }
      },
      ConsultationTicketAttribute: {
        select: {
          noteTemplateName: true,
          status: true,
        }
      },
      Appointment: {
        select: {
          Requesters: {
            select: {
              email: true
            }
          },
          AppointmentAttribute: {
            select: {
              AppointmentMode: {
                select: {
                  id: true,
                  name: true
                }
              },
              AppointmentType: {
                select: {
                  id: true,
                  name: true
                }
              },
              Service: {
                select: {
                  id: true,
                  name: true
                }
              },
            }
          }
        }
      }
    }
  })

  return {
    status: true,
    message: "Consultation record fetched successfully",
    data: consultationTicket
  }
})


export type GetConsultationTickets = Awaited<ReturnType<typeof getConsultationTicketsAction>>;
export const getConsultationTicketsAction = async ({orgUid, filters}: {orgUid: string, filters?: {
  showArchived?: boolean
}}) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: []
  }

  const { showArchived } = filters ?? {}
  const consultationTickets = await prismaTenant.consultationTicket.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      isActive: true,
      ...showArchived ? {}: { isArchived: false},
      orgUid,
      OR: [
        { createdBy: session.user.email },
        { Appointment: { Requesters: { some: { email: session.user.email } } } }
      ]
    },
    select: {
      id: true,
      subject: true,
      appointmentId: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      isArchived: true,
      System: {
        select: {
          id: true,
          name: true
        }
      },
      ConsultationTicketAttribute: {
        select: {
          noteTemplateName: true,
          status: true,
        }
      },
      Appointment: {
        select: {
          Requesters: {
            select: {
              email: true
            }
          },
          AppointmentAttribute: {
            select: {
              AppointmentMode: {
                select: {
                  id: true,
                  name: true
                }
              },
              AppointmentType: {
                select: {
                  id: true,
                  name: true
                }
              },
              Service: {
                select: {
                  id: true,
                  name: true
                }
              },
            }
          }
        }
      }
    }
  })
  return {
    status: true,
    message: "Consultation records fetched successfully",
    data: consultationTickets
  }
}

type UpdateConsultationTicketPayload = {
  consultationId: number;
  subject: string;
}
export const updateConsultationTicketAction = async ({consultationId, subject}: UpdateConsultationTicketPayload) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  try {
    await prismaTenant.consultationTicket.update({
      where: { id: consultationId, createdBy: session.user.email },
      data: { subject }
    })
    return {
      status: true,
      message: "Consultation Record updated successfully",
      data: null
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to update consultation record"
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


export const deleteConsultationTicketAction = async (consultationId: number) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  try {
    await prismaTenant.consultationTicket.update({
      where: { id: consultationId, createdBy: session.user.email },
      data: {
        isActive: false
      }
    })
    return {
      status: true,
      message: "Consultation Record deleted successfully",
      data: null
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to delete consultation record"
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



export const archiveConsultationTicketAction = async (consultationId: number) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  try {
    await prismaTenant.consultationTicket.update({
      where: { id: consultationId, createdBy: session.user.email, isActive: true, isArchived: false },
      data: {
        isArchived: true
      }
    })
    return {
      status: true,
      message: "Consultation Record archived successfully",
      data: null
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to archive consultation record"
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