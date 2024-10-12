"use server";
import 'server-only'

import prismaTenant from '@lib/prisma-tenant';
import { getCachedSession } from '@actions/session.action';
import { cache } from 'react';
import { getHPsAction } from '@actions/hp.actions';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { hasCodeProperty } from '@lib/utils';

type CreateConsultationTicketPayload = {
  systemId: number;
  appointmentId?: number;
  subject?: string;
  orgUid: string;
  hpIds: string[]
}

export const createConsultationTicketAction = async ({systemId, appointmentId, orgUid, subject, hpIds}: CreateConsultationTicketPayload) => {
  const session = await getCachedSession()
  
  try {
    if(!session) throw new Error("Unauthorized")

    const myPermissions = await getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" })
    const userPermissionArray = myPermissions.map(p => p.name);
    const createConsultationTicketPermissions = [PERMISSIONS.ORGANIZATION["CREATE:ORG:CONSULTATION_TICKET"].name]
    const canCreateConsultationTicket = createConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canCreateConsultationTicket) throw new Error("You do not have permission to create consultation tickets")
  
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
  } catch (error) {
    console.error(`Error creating consultation ticket: ${error}`);
    let message = "Failed to create consultation record"
    if(error instanceof Error) {
      message = error.message
    }
    return {
      status: false,
      message,
      data: null
    }
  }
}

export type GetConsultationTicket = Awaited<ReturnType<typeof getConsultationTicketAction>>;
export const getConsultationTicketAction = cache(async (consultationId: number, orgUid: string) => {
  const session = await getCachedSession()
  try {

    if(!session) throw new Error("Unauthorized")

    const [permissions, myHps] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
      getHPsAction({userId: session.user.sub})
    ])

    const userPermissionArray = permissions.map(p => p.name);
    const readAllOrgConsultationsPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:ALL"].name]
    const readOwnOrgConsultationPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:OWN"].name]
    const readCreatedOrgConsultationPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:CREATED"].name]
    const readCoCreatedOrgConsultationPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:CO_CREATED"].name]

    const canReadAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
    const canReadOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  
    const consultationTicket = await prismaTenant.consultationTicket.findUnique({
      where: { 
        id: consultationId,
        OR: [
          {
            ...canReadAllOrgConsultations ? {orgUid} : {},
          },
          { 
            ...canReadCreatedOrgConsultations 
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
            ...canReadOwnOrgConsultations
              ? { Appointment: { Requesters: {  some: { userId: session.user.sub } } } }
              : {}
          },
          {
            ...canReadCoCreatedOrgConsultations
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
        },
        ConsultationNotes: {
          select: {
            section: true,
            content: true,
          }
        }
      }
    })

    return {
      status: true,
      message: "Consultation record fetched successfully",
      data: consultationTicket
    }
  } catch (error) {
    console.error(`Error fetching consultation ticket: ${error}`);
    let message = "Failed to fetch consultation record"
    if(error instanceof Error) {
      message = error.message
    }
    return {
      status: false,
      message,
      data: null
    }
  }
})

export type GetConsultationTickets = Awaited<ReturnType<typeof getConsultationTicketsAction>>;
export const getConsultationTicketsAction = async ({orgUid, filters}: {orgUid: string, filters?: {
  showArchived?: boolean,
  userId: string
}}) => {
  const session = await getCachedSession()
  try {
    if(!session) throw new Error("Unauthorized")

    const { showArchived, userId } = filters ?? {}
    
    const [permissions, myHps] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub }),
      getHPsAction({userId: session.user.sub})
    ])
    const userPermissionArray = permissions.map(p => p.name);
    const readAllOrgConsultationsPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:ALL"].name]
    const readOwnOrgConsultationPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:OWN"].name]
    const readCreatedOrgConsultationPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:CREATED"].name]
    const readCoCreatedOrgConsultationPermissions = [PERMISSIONS.ORGANIZATION["READ:ORG:CONSULTATION_TICKET:CO_CREATED"].name]
    
    const canReadAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
    const canReadOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    
    const consultationTickets = await prismaTenant.consultationTicket.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        isActive: true,
        ...showArchived ? {}: { isArchived: false},
        ...userId !== "null" ? {
          Appointment: {
            Requesters: {
              some: {
                userId: userId
              }
            }
          }
        } : {},
        OR: [
          {
            ...canReadAllOrgConsultations ? {orgUid} : {},
          },
          { 
            ...canReadCreatedOrgConsultations 
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
            ...canReadOwnOrgConsultations 
              ? { Appointment: { Requesters: { some: { userId: session.user.sub } } } }
              : {},
          },
          {
            ...canReadCoCreatedOrgConsultations 
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
  } catch (error) {
    console.error(`Error fetching consultation tickets: ${error}`);
    let message = "Failed to fetch consultation records"
    if(error instanceof Error) {
      message = error.message
    }
    return {
      status: false,
      message,
      data: null
    }
  }
}

type UpdateConsultationTicketPayload = {
  consultationId: number;
  subject: string;
}
export const updateConsultationTicketAction = async ({consultationId, subject}: UpdateConsultationTicketPayload) => {
  const session = await getCachedSession()

  try {
    if(!session) throw new Error("Unauthorized")

    const [myPermissions, myHps] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
      getHPsAction({userId: session.user.sub})
    ])

    const userPermissionArray = myPermissions.map(p => p.name);
    const updateConsultationTicketPermissions = [
      PERMISSIONS.ORGANIZATION["UPDATE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.ORGANIZATION["UPDATE:ORG:CONSULTATION_TICKET:CO_CREATED"].name]
    const canUpdateConsultationTicket = updateConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canUpdateConsultationTicket) throw new Error("You do not have permission to update consultation tickets")

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
    console.error(`Error updating consultation ticket: ${error}`);
    let message = "Failed to update consultation record"
    if(error instanceof Error) {
      message = error.message
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      message = "Consultation record not found"
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

  try {
    if(!session) throw new Error("Unauthorized")

    const [myPermissions,myHps] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
      getHPsAction({userId: session.user.sub})
    ])

    const myPermissionArray = myPermissions.map(p => p.name);
    const deleteConsultationTicketPermissions = [
      PERMISSIONS.ORGANIZATION["DELETE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.ORGANIZATION["DELETE:ORG:CONSULTATION_TICKET:CO_CREATED"].name
    ]
    const canDeleteConsultationTicket = deleteConsultationTicketPermissions.some(p => myPermissionArray.includes(p))

    if(!canDeleteConsultationTicket) throw new Error("You do not have permission to delete consultation tickets")

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
    console.error(`Error deleting consultation ticket: ${error}`);
    let message = "Failed to delete consultation record"
    if(error instanceof Error) {
      message = error.message
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      message = "Consultation record not found"
    }
    return {
      status: false,
      message,
      data: null
    }
  }
}

export const toggleArchiveConsultationTicketAction = async (consultationId: number, isArchived: boolean) => {
  const session = await getCachedSession()
 
  try {
    if(!session) throw new Error("Unauthorized")

    const [myPermissions, myHps] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
      getHPsAction({userId: session.user.sub})
    ])

    const userPermissionArray = myPermissions.map(p => p.name);
    const updateConsultationTicketPermissions = [
      PERMISSIONS.ORGANIZATION["TOGGLE_ARCHIVE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.ORGANIZATION["TOGGLE_ARCHIVE:ORG:CONSULTATION_TICKET:CO_CREATED"].name
    ]
    const canUpdateConsultationTicket = updateConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canUpdateConsultationTicket) throw new Error("You do not have permission to update consultation tickets")

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
        isArchived: !isArchived
      },
      data: {
        isArchived
      }
    })
    return {
      status: true,
      message: "Consultation Ticket archive status toggled successfully",
    }
  } catch (error) {
    console.error(`Error toggling archive status: ${error}`);
    let message = "Failed to toggle archive status"
    if(error instanceof Error) {
      message = error.message
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      message = "Consultation record not found"
    }
    return {
      status: false,
      message,
    }
  }
}

export const resolveConsultationTicket = async (consultationId: number) => {
  const session = await getCachedSession()
  try {
    if(!session) throw new Error("Session not found")
      
    const resolveConsultationTicketPermissions = [
      PERMISSIONS.ORGANIZATION["RESOLVE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.ORGANIZATION["RESOLVE:ORG:CONSULTATION_TICKET:CO_CREATED"].name
    ]
    const myPermissions = await getPermissionsAction({ userId:session.user.sub })
    const userPermissionArray = myPermissions.map(p => p.name);
    const canResolveConsultationTicket = resolveConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canResolveConsultationTicket) throw new Error("You do not have permission to resolve consultation tickets")
      
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
    console.error(`Error resolving consultation ticket: ${error}`);
    let message = "Failed to resolve consultation record"
    if (error instanceof Error) {
      message = error.message
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      message = "Consultation record not found"
    }
    return {
      status: false,
      message,
      data: null
    }
  }
}