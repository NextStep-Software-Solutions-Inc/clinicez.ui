"use server";

import prismaClient from '@lib/prisma';
import { getCachedSession } from '@actions/session.action';
import { cache } from 'react';
import { getPermissionsAction, hasClinicPermissionAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { hasCodeProperty } from '@lib/utils';
import { withErrorHandling } from '@/lib/with-error-handling';
import { getHPsAction, GetHPsType } from '@actions/hp.actions';

type CreateConsultationTicketPayload = {
  systemId?: number;
  appointmentId?: number;
  clinicPatientId?: number;
  subject?: string;
  clinicUid: string;
  hpIds: number[]
}

export const createConsultationTicketAction = withErrorHandling(async ({ systemId, appointmentId, clinicPatientId, clinicUid, subject, hpIds }: CreateConsultationTicketPayload) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const userId = session.user.sub as string;

  const canCreateConsultationTicket = await hasClinicPermissionAction({
    userId,
    clinicUid,
    permissionName: PERMISSIONS.CLINIC["CREATE:CLINIC:CONSULTATION_TICKET"].name
  })

  if (!canCreateConsultationTicket) throw new Error("You do not have permission to create consultation tickets")

  const consultationTicket = await prismaClient.$transaction(async (prisma) => {
    let consultationConfig = await prismaClient.consultationConfig.findFirst({
      where: {
        Clinic: {
          clinicUid
        }
      }
    })

    if (!consultationConfig) {
      const defaultNoteTemplate = await prismaClient.noteTemplate.findFirst({
        where: { isActive: true }
      });

      if (!defaultNoteTemplate) {
         throw new Error("No active Note Templates found in the system. Please contact an administrator.");
      }

      const clinic = await prismaClient.clinic.findUnique({
        where: { clinicUid }
      });

      if (!clinic) {
         throw new Error("Clinic not found");
      }

      consultationConfig = await prismaClient.consultationConfig.create({
        data: {
          clinicId: clinic.id,
          noteTemplateId: defaultNoteTemplate.id
        }
      });
    }

    return await prismaClient.consultationTicket.create({
      data: {
        ...(systemId ? {
          System: {
            connect: { id: systemId }
          }
        } : {}),
        ...(appointmentId ? {
          Appointment: {
            connect: { id: appointmentId }
          }
        } : {}),
        ...(clinicPatientId ? {
          ClinicPatient: {
            connect: { id: clinicPatientId }
          }
        } : {}),
        Clinic: {
          connect: { clinicUid }
        },
        ConsultationTicketHPs: {
          createMany: {
            data: hpIds.map(hpId => ({ hpId }))
          }
        },
        subject,
        ConsultationTicketAttribute: {
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
  return { message: "Consultation Ticket created successfully", data: consultationTicket }
})

export type GetConsultationTicket = Awaited<ReturnType<typeof getConsultationTicketAction>>;
export const getConsultationTicketAction = withErrorHandling(cache(async (consultationId: number, clinicUid: string) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const [permissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ])

  const userPermissionArray = permissions.map(p => p.name);
  const readAllOrgConsultationsPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:ALL"].name]
  const readOwnOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:OWN"].name]
  const readCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:CREATED"].name]
  const readCoCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name]

  const canReadAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
  const canReadOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const canReadCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const canReadCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))

  // Check if user has any nurse healthcare provider role
  const userHps = await getHPsAction({ userId: session.user.sub });
  const isNurse = (userHps ?? []).some((hp: NonNullable<GetHPsType>[number]) => {
    const hpTypeName = hp.HPType?.name?.toLowerCase().trim() ?? "";
    return hpTypeName.includes("nurse");
  });

  const consultationTicket = await prismaClient.consultationTicket.findUnique({
    where: {
      id: consultationId,
      OR: [
        {
          ...(canReadAllOrgConsultations ? { Clinic: { clinicUid } } : {}),
        },
        {
          ...(canReadCreatedOrgConsultations ? {
            ConsultationTicketHPs: {
              some: {
                HealthCareProvider: {
                  User: {
                    userId: session.user.sub
                  }
                }
              }
            }
          } : {})
        },
        {
          ...(canReadOwnOrgConsultations ? { Appointment: { Requesters: { some: { User: { userId: session.user.sub } } } } } : {})
        },
        {
          ...(canReadCoCreatedOrgConsultations ? {
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
          } : {})
        },
        // Allow nurses who are assigned to the appointment to view consultation notes
        ...(isNurse ? [{
          Appointment: {
            AppointmentRouting: {
              some: {
                status: "ACCEPTED",
                RoutedTo: {
                  User: {
                    userId: session.user.sub
                  },
                  HPType: {
                    name: {
                      contains: "nurse",
                      mode: "insensitive" as const
                    }
                  }
                }
              }
            }
          }
        }] : [])
      ]
    },
    select: {
      id: true,
      Clinic: {
        select: {
          clinicUid: true
        }
      },
      subject: true,
      appointmentId: true,
      clinicId: true,
      ConsultationTicketHPs: {
        select: {
          hpId: true,
          HealthCareProvider: {
            select: {
              id: true,
              isActive: true,
              User: {
                select: {
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
                }
              },
              HPProfile: {
                select: {
                  name: true,
                  title: true,
                  suffix: true,
                  specialties: true,
                  picture: true,
                }
              },
              HPType: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      },
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
          NoteTemplate: {
            select: {
              id: true,
              name: true,
            }
          },
          status: true,
        }
      },
      Appointment: {
        select: {
          Requesters: {
            select: {
              User: {
                select: {
                  id: true,
                  userId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  email: true,
                }
              }
            }
          },
          AppointmentAttribute: {
            select: {
              date: true,
              timeStart: true,
              timeEnd: true,
              receivedAt: true,
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
              ReceivedBy: {
                select: {
                  id: true,
                  userId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  email: true,
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: {
                        select: {
                          id: true,
                          name: true,
                        }
                      },
                      Organization: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
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

  return { message: "Consultation record fetched successfully", data: consultationTicket }
}))


export type GetConsultationTicketsFilters = {
  showArchived?: boolean,
  userId?: string,
  clinicUid: string
}

export type GetConsultationTickets = Awaited<ReturnType<typeof getConsultationTicketsAction>>;
export const getConsultationTicketsAction = withErrorHandling(async (filters: GetConsultationTicketsFilters) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const { showArchived, userId, clinicUid } = filters

  const [permissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ])

  const userPermissionArray = permissions.map(p => p.name);
  const readAllOrgConsultationsPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:ALL"].name]
  const readOwnOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:OWN"].name]
  const readCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:CREATED"].name]
  const readCoCreatedOrgConsultationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name]

  const canReadAllOrgConsultations = readAllOrgConsultationsPermissions.every(p => userPermissionArray.includes(p))
  const canReadOwnOrgConsultations = readOwnOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const canReadCreatedOrgConsultations = readCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))
  const canReadCoCreatedOrgConsultations = readCoCreatedOrgConsultationPermissions.every(p => userPermissionArray.includes(p))

  // Check if user has any nurse healthcare provider role
  const userHps = await getHPsAction({ userId: session.user.sub });
  const isNurse = (userHps ?? []).some((hp: NonNullable<GetHPsType>[number]) => {
    const hpTypeName = hp.HPType?.name?.toLowerCase().trim() ?? "";
    return hpTypeName.includes("nurse");
  });

  const consultationTickets = await prismaClient.consultationTicket.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      isActive: true,
      Clinic: {
        clinicUid
      },
      ...(showArchived ? {} : { isArchived: false }),
      ...(userId !== "null" ? {
        Appointment: {
          Requesters: {
            some: {
              User: {
                userId
              }
            }
          }
        }
      } : {}),
      OR: [
        {
          ...(canReadAllOrgConsultations ? { Clinic: { clinicUid } } : {}),
        },
        {
          ...(canReadCreatedOrgConsultations ? {
            ConsultationTicketHPs: {
              some: {
                HealthCareProvider: {
                  User: {
                    userId: session.user.sub
                  }
                }
              }
            }
          } : {})
        },
        {
          ...(canReadOwnOrgConsultations ? { Appointment: { Requesters: { some: { User: { userId: session.user.sub } } } } } : {}),
        },
        {
          ...(canReadCoCreatedOrgConsultations ? {
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
          } : {})
        },
        // Allow nurses who are assigned to the appointment to view consultation tickets
        ...(isNurse ? [{
          Appointment: {
            AppointmentRouting: {
              some: {
                status: "ACCEPTED",
                RoutedTo: {
                  User: {
                    userId: session.user.sub
                  },
                  HPType: {
                    name: {
                      contains: "nurse",
                      mode: "insensitive" as const
                    }
                  }
                }
              }
            }
          }
        }] : [])
      ]
    },
    select: {
      id: true,
      subject: true,
      clinicId: true,
      Clinic: {
        select: {
          clinicUid: true
        }
      },
      appointmentId: true,
      ConsultationTicketHPs: {
        select: {
          HealthCareProvider: {
            select: {
              id: true,
              User: {
                select: {
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
                }
              },
              HPProfile: {
                select: {
                  name: true,
                  title: true,
                  suffix: true,
                  specialties: true,
                }
              }
            }
          }
        }
      },
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
      ConsultationNotes: {
        select: {
          id: true,
          section: true,
          content: true,
        }
      },
      Appointment: {
        select: {
          Requesters: {
            select: {
              User: {
                select: {
                  id: true,
                  userId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  email: true,
                  gender: true,
                  dob: true,
                  StudentRecords: {
                    select: {
                      Program: {
                        select: {
                          id: true,
                          name: true,
                        }
                      },
                      OrganizationYearLevel: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  },
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: {
                        select: {
                          id: true,
                          name: true,
                        }
                      },
                      Organization: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          complaint: true,
          PreAssessmentNotes: {
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              assessment: true,
              homeInstructions: true,
              remarks: true,
              createdAt: true,
              CreatedBy: {
                select: {
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: {
                        select: {
                          name: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          AppointmentAttribute: {
            select: {
              id: true,
              status: true,
              date: true,
              timeStart: true,
              timeEnd: true,
              receivedAt: true,
              AppointmentMode: {
                select: {
                  id: true,
                  name: true,
                },
              },
              AppointmentType: {
                select: {
                  id: true,
                  name: true,
                }
              },
              Service: {
                select: {
                  id: true,
                  name: true,
                  ServiceCategory: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              ReceivedBy: {
                select: {
                  id: true,
                  userId: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  suffix: true,
                  email: true,
                  OrganizationMembers: {
                    select: {
                      OrganizationRole: {
                        select: {
                          id: true,
                          name: true,
                        }
                      },
                      Organization: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
                }
              },
            },
          },
          AppointmentTag: {
            select: {
              id: true,
              HealthcareProvider: {
                select: {
                  id: true,
                  HPType: {
                    select: {
                      id: true,
                      name: true,
                    }
                  },
                  HPProfile: {
                    select: {
                      title: true,
                      name: true,
                      suffix: true,
                      specialties: true,
                    }
                  },
                  User: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      suffix: true,
                    }
                  }
                }
              }
            }
          }
        },
      },
    },
  })
  return { message: "Consultation records fetched successfully", data: consultationTickets }
})

type UpdateConsultationTicketPayload = {
  consultationId: number;
  subject: string;
}

type AddConsultationTicketHPPayload = {
  consultationId: number;
  hpId: number;
  clinicUid: string;
}

export const addConsultationTicketHPAction = withErrorHandling(async ({ consultationId, hpId, clinicUid }: AddConsultationTicketHPPayload) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const userId = session.user.sub as string;

  // Check permission to add healthcare provider to consultation ticket
  const hasPermissionToAddHP = await hasClinicPermissionAction({
    userId,
    clinicUid,
    permissionName: PERMISSIONS.CLINIC["ADD:CLINIC:CONSULTATION_TICKET:HP"].name
  })

  if (!hasPermissionToAddHP) throw new Error("You do not have permission to add healthcare provider to consultation tickets")

  const consultationTicket = await prismaClient.consultationTicket.findFirst({
    where: {
      id: consultationId,
      Clinic: {
        clinicUid
      },
      isActive: true
    },
    select: {
      ConsultationTicketHPs: {
        select: {
          hpId: true,
          HealthCareProvider: {
            select: {
              User: {
                select: {
                  userId: true,
                }
              }
            }
          }
        }
      }
    }
  })

  if (!consultationTicket) throw new Error("Consultation record not found")

  const isTicketCreator = consultationTicket.ConsultationTicketHPs.some(hp => hp.HealthCareProvider?.User?.userId === session.user.sub)
  if (!isTicketCreator) throw new Error("You do not have permission to update consultation tickets")

  const targetHp = await prismaClient.healthcareProvider.findFirst({
    where: {
      id: hpId,
      isActive: true,
      User: {
        ClinicMembers: {
          some: {
            Clinic: {
              clinicUid
            },
            isActive: true
          }
        }
      }
    },
    select: {
      id: true
    }
  })

  if (!targetHp) throw new Error("Healthcare provider is not active or not part of this clinic")

  const alreadyAssigned = consultationTicket.ConsultationTicketHPs.some(hp => hp.hpId === hpId)
  if (alreadyAssigned) return { message: "Healthcare provider is already assigned to this consultation", data: undefined }

  await prismaClient.consultationTicketHP.create({
    data: {
      consultationTicketId: consultationId,
      hpId,
    }
  })

  return { message: "Healthcare provider added to consultation ticket", data: undefined }

}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return "Consultation record not found"
  if (hasCodeProperty(error) && error.code === 'P2002') return "Healthcare provider is already assigned to this consultation"
})

export const updateConsultationTicketAction = withErrorHandling(async ({ consultationId, subject }: UpdateConsultationTicketPayload) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ])

  const userPermissionArray = myPermissions.map(p => p.name);

  const updateConsultationTicketPermissions = [
    PERMISSIONS.CLINIC["UPDATE:CLINIC:CONSULTATION_TICKET:CREATED"].name,
    PERMISSIONS.CLINIC["UPDATE:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name]
  const canUpdateConsultationTicket = updateConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

  if (!canUpdateConsultationTicket) throw new Error("You do not have permission to update consultation tickets")

  await prismaClient.consultationTicket.update({
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
      // Block updates on resolved consultations
      NOT: {
        ConsultationTicketAttribute: {
          status: "RESOLVED"
        }
      }
    },
    data: { subject }
  })
  return { message: "Consultation Ticket updated successfully", data: undefined }

}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return "Consultation record not found, already resolved, or you do not have permission to update it";
})

export const deleteConsultationTicketAction = withErrorHandling(async (consultationId: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ])

  const myPermissionArray = myPermissions.map(p => p.name);
  const deleteConsultationTicketPermissions = [
    PERMISSIONS.CLINIC["DELETE:CLINIC:CONSULTATION_TICKET:CREATED"].name,
    PERMISSIONS.CLINIC["DELETE:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name
  ]
  const canDeleteConsultationTicket = deleteConsultationTicketPermissions.some(p => myPermissionArray.includes(p))

  if (!canDeleteConsultationTicket) throw new Error("You do not have permission to delete consultation tickets")

  await prismaClient.consultationTicket.update({
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
  return { message: "Consultation Ticket deleted successfully", data: undefined }
}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return "Consultation record not found"
})

export const toggleArchiveConsultationTicketAction = withErrorHandling(async (consultationId: number, isArchived: boolean) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ])

  const userPermissionArray = myPermissions.map(p => p.name);
  const updateConsultationTicketPermissions = [
    PERMISSIONS.CLINIC["TOGGLE_ARCHIVE:CLINIC:CONSULTATION_TICKET:CREATED"].name,
    PERMISSIONS.CLINIC["TOGGLE_ARCHIVE:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name
  ]
  const canUpdateConsultationTicket = updateConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

  if (!canUpdateConsultationTicket) throw new Error("You do not have permission to update consultation tickets")

  await prismaClient.consultationTicket.update({
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
  return { message: "Consultation Ticket archive status toggled successfully", data: undefined }

}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return "Consultation record not found"
})

/**
 * Drop a consultation ticket — marks it as DROPPED with a required reason.
 * Only consultations that are NOT yet RESOLVED or DROPPED can be dropped.
 */
export const dropConsultationTicketAction = withErrorHandling(async ({
  consultationId,
  reason,
}: {
  consultationId: number;
  reason: string;
}) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Session not found");

  if (!reason.trim()) throw new Error("A reason is required to drop this consultation.");

  const dropPermissions = [
    PERMISSIONS.CLINIC["DROP:CLINIC:CONSULTATION_TICKET"].name,
    PERMISSIONS.CLINIC["RESOLVE:CLINIC:CONSULTATION_TICKET:CREATED"].name,
    PERMISSIONS.CLINIC["RESOLVE:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name,
  ];
  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const userPermissionArray = myPermissions.map(p => p.name);
  const canDrop = dropPermissions.some(p => userPermissionArray.includes(p));

  if (!canDrop) throw new Error("You do not have permission to drop consultation tickets");

  const user = await prismaClient.user.findUniqueOrThrow({
    where: { userId: session.user.sub },
    select: { id: true },
  });

  await prismaClient.consultationTicketAttribute.update({
    where: {
      consultationTicketId: consultationId,
      status: {
        notIn: ["RESOLVED", "DROPPED"],
      },
    },
    data: {
      status: "DROPPED",
      droppedAt: new Date(),
      droppedBy: user.id,
      dropReason: reason.trim(),
    },
  });

  return { message: "Consultation ticket dropped successfully", data: undefined };
}, async (error) => {
  if (hasCodeProperty(error) && error.code === 'P2025') return "Consultation record not found or already resolved/dropped";
  if (error instanceof Error) return error.message;
});



export const resolveConsultationTicket = withErrorHandling(async (consultationId: number) => {

  const session = await getCachedSession()
  if (!session) throw new Error("Session not found")

  const resolveConsultationTicketPermissions = [
    PERMISSIONS.CLINIC["RESOLVE:CLINIC:CONSULTATION_TICKET:CREATED"].name,
    PERMISSIONS.CLINIC["RESOLVE:CLINIC:CONSULTATION_TICKET:CO_CREATED"].name
  ]
  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" })
  const userPermissionArray = myPermissions.map(p => p.name);
  const canResolveConsultationTicket = resolveConsultationTicketPermissions.some(p => userPermissionArray.includes(p))

  if (!canResolveConsultationTicket) throw new Error("You do not have permission to resolve consultation tickets")

  // Guard: if this is a PhilHealth Konsulta consultation, ensure profiling is complete
  const ticket = await prismaClient.consultationTicket.findUnique({
    where: { id: consultationId },
    select: {
      isPhilHealthKonsulta: true,
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select: {
              firstName: true, lastName: true, dob: true, gender: true,
              bloodType: true, mobile: true,
              PhilHealthRecords: { take: 1, select: { pin: true, memberType: true } },
              VitalSigns: {
                where: { isActive: true, deletedAt: null },
                take: 1,
                select: { height: true, weight: true, bpSystolic: true },
              },
            },
          },
          PhilHealthKonsultaEnlistments: {
            where: { status: "ACTIVE" },
            take: 1,
            select: { hciCaseNo: true, profilingTransNo: true, enlistmentTransNo: true },
          },
        },
      },
    },
  });

  if (ticket?.isPhilHealthKonsulta) {
    const cp = ticket.ClinicPatient;
    const pat = cp?.Patient;
    const enlistment = cp?.PhilHealthKonsultaEnlistments[0];
    const vitals = pat?.VitalSigns[0];
    const phRecord = pat?.PhilHealthRecords[0];

    const missing: string[] = [];
    if (!pat?.firstName || !pat?.lastName) missing.push("Patient name");
    if (!pat?.dob) missing.push("Date of birth");
    if (!pat?.gender) missing.push("Sex/gender");
    if (!pat?.bloodType) missing.push("Blood type");
    if (!pat?.mobile) missing.push("Mobile number");
    if (!phRecord?.pin) missing.push("PhilHealth PIN");
    if (!phRecord?.memberType) missing.push("Member type");
    if (!enlistment?.hciCaseNo) missing.push("HCI Case No.");
    if (!enlistment?.profilingTransNo) missing.push("Profiling Trans No.");
    if (!vitals?.height || !vitals?.weight) missing.push("Vitals (height/weight)");

    if (missing.length > 0) {
      throw new Error(
        `Cannot resolve: PhilHealth Konsulta profiling is incomplete. Missing: ${missing.join(", ")}`
      );
    }
  }

  await prismaClient.consultationTicketAttribute.update({
    where: {
      consultationTicketId: consultationId,
      status: {
        not: "RESOLVED"
      }
    },
    data: { status: "RESOLVED" }
  })
  return { message: "Consultation Ticket resolved successfully", data: undefined }

}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return "Consultation record not found";
})