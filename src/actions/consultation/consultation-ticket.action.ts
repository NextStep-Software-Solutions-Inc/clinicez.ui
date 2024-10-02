"use server";
import 'server-only'

import prismaTenant from '@lib/prisma-tenant';
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';
import { getCachedSession } from '@actions/session.action';
import { cache } from 'react';
import { getHPsAction } from '@actions/hp.actions';
import { getPermissionsAction } from '@actions/permission.action';

type CreateConsultationTicketPayload = {
  systemId: number;
  appointmentId?: number;
  subject?: string;
  orgUid: string;
  hpIds: string[]
}

export const createConsultationTicketAction = async ({systemId, appointmentId, orgUid, subject, hpIds}: CreateConsultationTicketPayload) => {
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
      ConsultationTicketAuthors: {
        createMany: {
          data: hpIds.map(hpId => ({hpId}))
        }
      },
      ConsultationTicketAttribute:{
        create: {
        }
      }
    }
  })
  return {
    status: true,
    message: "Consultation Ticket created successfully",
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

  const [permissions, myHps] = await Promise.all([
    getPermissionsAction(session.user.sub),
    getHPsAction({userId: session.user.sub})
  ])

  const userPermissionArray = permissions.map(p => p.name);
  const readAllOrgConsultationsPermissions = ["read:org:consultation:all"]
  const readOwnOrgConsultationPermissions = ["read:org:consultation:own"]
  const readCreatedOrgConsultationPermissions = ["read:org:consultation:created"]
  const readCoCreatedOrgConsultationPermissions = ["read:org:consultation:co-created"]

  const readAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
  const readOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const readCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const readCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  
  const consultationTicket = await prismaTenant.consultationTicket.findUnique({
    where: { 
      id: consultationId,
      OR: [
        {
          ...readAllOrgConsultations ? {orgUid} : {},
        },
        { 
          ...readCreatedOrgConsultations 
            ? { 
              ConsultationTicketAuthors: { 
                some: { 
                  hpId: { in: myHps.map(hp => hp.id.toString()) } 
                }
              } 
            } 
            : {}
        },
        {
          ...readOwnOrgConsultations
            ? { Appointment: { Requesters: {  some: { userId: session.user.sub } } } }
            : {}
        },
        {
          ...readCoCreatedOrgConsultations
            ? {
              Appointment: {
                AppointmentRouting: {
                  some: {
                    status: "ACCEPTED",
                    routedTo: {
                      in: myHps.map(hp => hp.id.toString())
                    }
                  }
                }
              }
            }
            : {}
        }
      ]
    },
    select: {
      id: true,
      subject: true,
      appointmentId: true,
      orgUid: true,
      ConsultationTicketAuthors: true,
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
              userId: true
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

  const [permissions, myHps] = await Promise.all([
    getPermissionsAction(session.user.sub),
    getHPsAction({userId: session.user.sub})
  ])
  const userPermissionArray = permissions.map(p => p.name);
  const readAllOrgConsultationsPermissions = ["read:org:consultation:all"]
  const readOwnOrgConsultationPermissions = ["read:org:consultation:own"]
  const readCreatedOrgConsultationPermissions = ["read:org:consultation:created"]
  const readCoCreatedOrgConsultationPermissions = ["read:org:consultation:co-created"]

  const readAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
  const readOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const readCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const readCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))

  const consultationTickets = await prismaTenant.consultationTicket.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      isActive: true,
      ...showArchived ? {}: { isArchived: false},
      OR: [
        {
          ...readAllOrgConsultations ? {orgUid} : {},
        },
        { 
          ...readCreatedOrgConsultations 
            ? { 
              ConsultationTicketAuthors: {
                some: {
                  hpId: {
                    in: myHps.map(hp => hp.id.toString())
                  }
                }
              }
            } 
            : {}
        },
        { 
          ...readOwnOrgConsultations 
            ? { Appointment: { Requesters: { some: { userId: session.user.sub } } } }
            : {},
        },
        {
          ...readCoCreatedOrgConsultations 
            ? {
              Appointment: {
                AppointmentRouting: {
                  some: {
                    status: "ACCEPTED",
                    routedTo: {
                      in: myHps.map(hp => hp.id.toString())
                    }
                  }
                }
              }
            }
            : {}
        }
      ]
    },
    select: {
      id: true,
      subject: true,
      orgUid: true,
      appointmentId: true,
      ConsultationTicketAuthors: true,
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
              userId: true
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
    const myHps = await getHPsAction({userId: session.user.sub})
    await prismaTenant.consultationTicket.update({
      where: { 
        id: consultationId, 
        ConsultationTicketAuthors: {
          some: {
            hpId: {
              in: myHps.map(hp => hp.id.toString())
            }
          }
        }
      },
      data: { subject }
    })
    return {
      status: true,
      message: "Consultation Ticket updated successfully",
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
    const myHps = await getHPsAction({userId: session.user.sub})
    await prismaTenant.consultationTicket.update({
      where: { 
        id: consultationId, 
        ConsultationTicketAuthors: {
          some: {
            hpId: {
              in: myHps.map(hp => hp.id.toString())
            }
          }
        }
      },
      data: {
        isActive: false
      }
    })
    return {
      status: true,
      message: "Consultation Ticket deleted successfully",
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
    const myHps = await getHPsAction({userId: session.user.sub})
    await prismaTenant.consultationTicket.update({
      where: { 
        id: consultationId, 
        ConsultationTicketAuthors: {
          some: {
            hpId: {
              in: myHps.map(hp => hp.id.toString())
            }
          }
        }, 
        isActive: true, 
        isArchived: false },
      data: {
        isArchived: true
      }
    })
    return {
      status: true,
      message: "Consultation Ticket archived successfully",
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

export const resolveConsultationTicket = async (consultationId: number) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  try {
    await prismaTenant.consultationTicketAttribute.update({
      where: { 
        consultationTicketId: consultationId,
        status: {
          not: "RESOLVED"
        }
      },
      data: { status: "RESOLVED" }
    })
    return {
      status: true,
      message: "Consultation Ticket resolved successfully",
      data: null
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to resolve consultation record"
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