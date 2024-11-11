"use server";
import 'server-only'

import prisma from '@lib/prisma';
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
  clinicUid: string;
  hpIds: number[]
}

export const createConsultationTicketAction = async ({systemId, appointmentId, clinicUid, subject, hpIds}: CreateConsultationTicketPayload) => {
  const session = await getCachedSession()
  
  try {
    if(!session) throw new Error("Unauthorized")

    const myPermissions = await getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" })
    const userPermissionArray = myPermissions.map(p => p.name);
    const createConsultationTicketPermissions = [PERMISSIONS.CLINIC["CREATE:ORG:CONSULTATION_TICKET"].name]
    const canCreateConsultationTicket = createConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canCreateConsultationTicket) throw new Error("You do not have permission to create consultation tickets")
      
      
    const consultationTicket = await prisma.$transaction(async (prisma) => {
      const consultationConfig = await prisma.consultationConfig.findFirstOrThrow({
        where: {
          Clinic: {
            clinicUid
          }
        }
      })

      return await prisma.consultationTicket.create({
        data: {
          System: {
            connect: {id: systemId}
          },
          Appointment: {
            connect: {id: appointmentId}
          },
          Clinic: {
            connect: { clinicUid }
          },
          ConsultationTicketHPs: {
            createMany: {
              data: hpIds.map(hpId => ({hpId}))
            }
          },
          subject,
          ConsultationTicketAttribute:{
            create: {
              status: "PROCESSING",
              NoteTemplate: {
                connect: {
                  id: consultationConfig.noteTemplateId
                }
              }
            }
          }
        }
      })
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
export const getConsultationTicketAction = cache(async (consultationId: number, clinicUid: string) => {
  const session = await getCachedSession()
  try {

    if(!session) throw new Error("Unauthorized")

    const [permissions] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
    ])

    const userPermissionArray = permissions.map(p => p.name);
    const readAllOrgConsultationsPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:ALL"].name]
    const readOwnOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:OWN"].name]
    const readCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:CREATED"].name]
    const readCoCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:CO_CREATED"].name]

    const canReadAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
    const canReadOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  
    const consultationTicket = await prisma.consultationTicket.findUnique({
      where: { 
        id: consultationId,
        OR: [
          {
            ...canReadAllOrgConsultations ? {Clinic: {clinicUid}} : {},
          },
          { 
            ...canReadCreatedOrgConsultations 
              ? { 
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
              : {}
          },
          {
            ...canReadOwnOrgConsultations
              ? { Appointment: { Requesters: {  some: { User: {userId: session.user.sub} } } } }
              : {}
          },
          {
            ...canReadCoCreatedOrgConsultations
              ? {
                Appointment: {
                  AppointmentRouting: {
                    some: {
                      status: "ACCEPTED",
                      RoutedTo: {
                        User: {
                          userId: session.user.sub
                        }
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
        clinicId: true,
        ConsultationTicketHPs: true,
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
            noteTemplateId: true,
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
            showOnPatient: true,
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
export const getConsultationTicketsAction = async ({clinicUid, filters}: {clinicUid: string, filters?: {
  showArchived?: boolean,
  userId: string
}}) => {
  const session = await getCachedSession()
  try {
    if(!session) throw new Error("Unauthorized")

    const { showArchived, userId } = filters ?? {}
    
    const [permissions] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub }),
    ])
    const userPermissionArray = permissions.map(p => p.name);
    const readAllOrgConsultationsPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:ALL"].name]
    const readOwnOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:OWN"].name]
    const readCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:CREATED"].name]
    const readCoCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:ORG:CONSULTATION_TICKET:CO_CREATED"].name]
    
    const canReadAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
    const canReadOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    const canReadCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
    
    const consultationTickets = await prisma.consultationTicket.findMany({
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
                User: {
                  userId
                }
              }
            }
          }
        } : {},
        OR: [
          {
            ...canReadAllOrgConsultations ? {Clinic: {clinicUid}} : {},
          },
          { 
            ...canReadCreatedOrgConsultations 
              ? { 
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
              : {}
          },
          { 
            ...canReadOwnOrgConsultations 
              ? { Appointment: { Requesters: { some: { User: { userId: session.user.sub} } } } }
              : {},
          },
          {
            ...canReadCoCreatedOrgConsultations 
              ? {
                Appointment: {
                  AppointmentRouting: {
                    some: {
                      status: "ACCEPTED",
                      RoutedTo: {
                        User: {
                          userId: session.user.sub
                        }
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
        clinicId: true,
        appointmentId: true,
        ConsultationTicketHPs: true,
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
            noteTemplateId: true,
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
      data: []
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

    const [myPermissions] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
    ])

    const userPermissionArray = myPermissions.map(p => p.name);
    const updateConsultationTicketPermissions = [
      PERMISSIONS.CLINIC["UPDATE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.CLINIC["UPDATE:ORG:CONSULTATION_TICKET:CO_CREATED"].name]
    const canUpdateConsultationTicket = updateConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canUpdateConsultationTicket) throw new Error("You do not have permission to update consultation tickets")

    await prisma.consultationTicket.update({
      where: { 
        id: consultationId, 
        ConsultationTicketHPs: {
          some: {
            HealthCareProvider: {
              User: {
                userId: session.user.sub
              }
            }
          }
        }
      },
      data: { subject }
    })
    return { status: true, message: "Consultation Ticket updated successfully", data: null }
  } catch (error) {
    console.error(`Error updating consultation ticket: ${error}`);
    let message = "Failed to update consultation record"
    if(error instanceof Error)  message = error.message
    if(hasCodeProperty(error) && error.code === 'P2025')  message = "Consultation record not found"
    return { status: false,  message, data: null }
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
      PERMISSIONS.CLINIC["DELETE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.CLINIC["DELETE:ORG:CONSULTATION_TICKET:CO_CREATED"].name
    ]
    const canDeleteConsultationTicket = deleteConsultationTicketPermissions.some(p => myPermissionArray.includes(p))

    if(!canDeleteConsultationTicket) throw new Error("You do not have permission to delete consultation tickets")

    await prisma.consultationTicket.update({
      where: { 
        id: consultationId, 
        ConsultationTicketHPs: {
          some: {
            HealthCareProvider: {
              User: {
                userId: session.user.sub
              }
            }
          }
        }
      },
      data: {
        isActive: false
      }
    })
    return { status: true, message: "Consultation Ticket deleted successfully" }
  } catch (error) {
    console.error(`Error deleting consultation ticket: ${error}`);
    let message = "Failed to delete consultation record"
    if(error instanceof Error) message = error.message
    if(hasCodeProperty(error) && error.code === 'P2025') message = "Consultation record not found"
    return { status: false, message}
  }
}

export const toggleArchiveConsultationTicketAction = async (consultationId: number, isArchived: boolean) => {
  const session = await getCachedSession()
 
  try {
    if(!session) throw new Error("Unauthorized")

    const [myPermissions] = await Promise.all([
      getPermissionsAction({ userId:session.user.sub, type: "ORGANIZATION" }),
    ])

    const userPermissionArray = myPermissions.map(p => p.name);
    const updateConsultationTicketPermissions = [
      PERMISSIONS.CLINIC["TOGGLE_ARCHIVE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.CLINIC["TOGGLE_ARCHIVE:ORG:CONSULTATION_TICKET:CO_CREATED"].name
    ]
    const canUpdateConsultationTicket = updateConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canUpdateConsultationTicket) throw new Error("You do not have permission to update consultation tickets")

    await prisma.consultationTicket.update({
      where: { 
        id: consultationId, 
        ConsultationTicketHPs: {
          some: {
            HealthCareProvider: {
              User: {
                userId: session.user.sub
              }
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
    return { status: true, message: "Consultation Ticket archive status toggled successfully" }
  } catch (error) {
    console.error(`Error toggling archive status: ${error}`);
    let message = "Failed to toggle archive status"
    if(error instanceof Error) message = error.message
    if(hasCodeProperty(error) && error.code === 'P2025')  message = "Consultation record not found"
    return {  status: false, message }  }
}

export const resolveConsultationTicket = async (consultationId: number) => {
  const session = await getCachedSession()
  try {
    if(!session) throw new Error("Session not found")
      
    const resolveConsultationTicketPermissions = [
      PERMISSIONS.CLINIC["RESOLVE:ORG:CONSULTATION_TICKET:CREATED"].name,
      PERMISSIONS.CLINIC["RESOLVE:ORG:CONSULTATION_TICKET:CO_CREATED"].name
    ]
    const myPermissions = await getPermissionsAction({ userId:session.user.sub })
    const userPermissionArray = myPermissions.map(p => p.name);
    const canResolveConsultationTicket = resolveConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

    if(!canResolveConsultationTicket) throw new Error("You do not have permission to resolve consultation tickets")
      
    await prisma.consultationTicketAttribute.update({
      where: { 
        consultationTicketId: consultationId,
        status: {
          not: "RESOLVED"
        }
      },
      data: { status: "RESOLVED" }
    })
    return { status: true, message: "Consultation Ticket resolved successfully" }
  } catch (error) {
    console.error(`Error resolving consultation ticket: ${error}`);
    let message = "Failed to resolve consultation record"
    if (error instanceof Error)  message = error.message
    if(hasCodeProperty(error) && error.code === 'P2025')   message = "Consultation record not found"
    return { status: false, message }
  }
}