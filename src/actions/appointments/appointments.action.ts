"use server";
import "server-only";

import prismaTenant from "@lib/prisma-tenant";
import { Prisma } from "@prisma/tenant/client";
import {
  RoutedAptStatus,
  AppointmentStatus
} from "@public/json/appointment-list";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { cache } from "react";
import dayjs from "dayjs";
import { tr } from "@faker-js/faker";

export type GetAppointmentFilter = {
  orgUid?: string;
  status?: AppointmentStatus;
  routedAptStatus?: RoutedAptStatus;
  appointmentId?: number;
  sort?: "request" | "schedule";
};

type CreateAppointmentPayload = {
  orgUid: string;
  subject: string;
  complaint?: string;
  modeId: number;
  typeId: number;
  serviceId?: number;
  requesters: string[];
  attachments: string[];
  hpId?: string;
  schedule: {
    date: Date;
    timeStart: Date;
    timeEnd: Date;
  };
};
export const createAppointmentAction = async (payload: CreateAppointmentPayload) => {
  const session = await getCachedSession();
  if (!session) {
    return {
      status: false,
      message: "Unauthorized"
    };
  }

  const { orgUid, subject, complaint, requesters, modeId, typeId, serviceId, attachments, hpId, schedule } = payload;
  const { date, timeStart, timeEnd } = schedule;
  
  const createAppointmentPermissions = ["write:org:appointment"];
  const myPermissions = await getPermissionsAction(session.user.sub);
  const userPermissionArray = myPermissions.map(p => p.name);
  const createAppointment = createAppointmentPermissions.every(p => userPermissionArray.includes(p));

  try {
    
    if (!createAppointment) {
      throw new Error("You do not have permission to create an appointment in this organization");
    }
    
    const newAppointment = await prismaTenant.$transaction(async (prisma) => {
      const numberOfAppointments = await prisma.appointment.count({
        where: {
          orgUid,
          createdAt: {
            // today only
            gte: dayjs().startOf("day").toDate(),
          },
          AppointmentAttribute: {
            status: "PENDING"
          },
          Requesters: {
            some: {
              userId: session.user.sub
            }
          }
        }
      });
      const maxNumberOfAppointment = await prismaCommon.orgAppointmentConfig.findFirstOrThrow({
        where: {
          Organization: {
            orgId: orgUid
          }
        },
        select: {
          maxAppointmentsPerClient: true,
          maxAppointmentsPerDay: true
        }
      })
      if(numberOfAppointments >= maxNumberOfAppointment.maxAppointmentsPerClient) {
        throw new Error("You have reached the maximum number of appointments you can book for today");
      }
      if(numberOfAppointments >= maxNumberOfAppointment.maxAppointmentsPerDay) {
        throw new Error("The appointments quota of the organization for today has been reached");
      }
      
      return await prisma.appointment.create({
        data: {
          subject,
          complaint,
          orgUid,
          AppointmentAttribute: {
            create: {
              preferredAppointee: hpId,
              modeId,
              typeId,
              serviceId,
              timeStart,
              timeEnd,
              date: date
            }
          },
          Requesters: {
            createMany: {
              data: requesters.map((userId) => ({ userId })),
              skipDuplicates: true
            }
          },
          AppointmentAttachments: {
            createMany: {
              data: attachments.map((url) => ({
                name: url.split("/").pop() ?? url,
                url
              })),
              skipDuplicates: true
            }
          }
        }
      })
    })
    return {
      status: true,
      message: "Appointment created",
      data: newAppointment
    };
  } catch (error) {
    console.error(`Failed to create appointment: ${error}`);
    let message = "Failed to create appointment";
    if(error instanceof Error) {
      message = error.message;
    }
    return {
      status: false,
      message,
      data: null
    }
    
  }
};

export type GetAppointments = Awaited<ReturnType<typeof getAppointmentsAction>>;
export const getAppointmentsAction = cache(async (filter?: GetAppointmentFilter) => {
  const session = await getCachedSession();
  if (!session || !session.accessToken)
    return {
      status: false,
      message: "Unauthorized"
    };

  const { orgUid, status, routedAptStatus, sort } = filter || {};

  const permissions = await getPermissionsAction(session.user.sub);
  const userPermissionArray = permissions.map(p => p.name);

  const readAllOrgAppointmentPermission = ["read:org:appointment:all"];
  const readAOwnOrgAppointmentPermission = ["read:org:appointment:own"];
  const readAssignedOrgAppointmentPermission = ["read:org:appointment:assigned"];

  const readAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))

  const appointments = await prismaTenant.appointment.findMany({
    orderBy: {
      ...(sort === "schedule"
        ? {
          AppointmentAttribute: {
            date: "asc",
          }
        }
        : { createdAt: "desc" })
    },
    where: {
      orgUid,
      isActive: true,
      AppointmentAttribute: { ...(status !== "ALL" ? { status } : {}) },
      ...(routedAptStatus
        ? {
          AppointmentRouting: {
            some: { status: routedAptStatus }
          }
        }
        : {}),
      OR: [
        { ...(readAllOrgAppointment ? { orgUid } : {}) },
        { ...(readAOwnOrgAppointment ? { Requesters: { some: { userId: session.user.sub } } } : {}) },
        { ...(readAssignedOrgAppointment ? {
          AppointmentRouting: {
            some: {
              OR: [
                { routedTo: session.user.sub },
                { routedBy: session.user.sub }
              ]
            }
          }
        } : {}) },
      ]
    },
    select: {
      id: true,
      subject: true,
      complaint: true,
      createdAt: true,
      updatedAt: true,
      Requesters: {
        select: {
          userId: true
        }
      },
      _count: {
        select: {
          ConsultationTickets: true
        }
      },
      AppointmentAttribute: {
        select: {
          date: true,
          timeStart: true,
          completedAt: true,
          receivedAt: true,
          rejectedAt: true,
          rescheduledAt: true,
          AppointmentType: {
            select: {
              name: true
            }
          },
          AppointmentMode: {
            select: {
              name: true
            }
          },
          preferredAppointee: true,
          status: true,
          Service: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });
  return {
    status: true,
    message: "Appointments fetched",
    data: appointments
  };
});

export type GetAppointment = Awaited<ReturnType<typeof getAppointmentAction>>;
export const getAppointmentAction = cache(async (id: number, orgUid?: string) => {
  const session = await getCachedSession();

  if (!session || !session.accessToken)
    return {
      status: false,
      message: "Unauthorized",
      data: null
    };

  const permissions = await getPermissionsAction(session.user.sub);
  const userPermissionArray = permissions.map(p => p.name);
  
  const readAllOrgAppointmentPermission = ["read:org:appointment:all"]; // read all appointments in the org
  const readAOwnOrgAppointmentPermission = ["read:org:appointment:own"]; // read appointments that the user is a requester
  const readAssignedOrgAppointmentPermission = ["read:org:appointment:assigned"]; // read appointments that the user is assigned to or assigned by
  
  const readAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  
  const appointment = await prismaTenant.appointment.findUnique({
    where: {
      isActive: true,
      OR: [
        { ...(readAllOrgAppointment ? { orgUid, id } : {}) },
        { ...(readAOwnOrgAppointment ? { Requesters: { some: { userId: session.user.sub } }, id } : {}) },
        { ...(readAssignedOrgAppointment ? {
          AppointmentRouting: {
            some: {
              OR: [
                { routedTo: session.user.sub },
                { routedBy: session.user.sub }
              ]
            }
          },
          id
        } : {}) },
      ],
      id
    },
    select: {
      id: true,
      subject: true,
      complaint: true,
      createdAt: true,
      Requesters: {
        select: {
          userId: true
        }
      },
      AppointmentAttachments: {
        select: {
          id: true,
          url: true
        }
      },
      AppointmentAttribute: {
        select: {
          date: true,
          timeStart: true,
          timeEnd: true,
          AppointmentType: {
            select: {
              id: true,
              name: true
            }
          },
          AppointmentMode: {
            select: {
              name: true
            }
          },
          status: true,
          Service: {
            select: {
              id: true,
              name: true
            }
          },
          rejectedAt: true,
          receivedAt: true,
          rejectedBy: true,
          receivedBy: true,
          rejectedReason: true,
          preferredAppointee: true,
          completedAt: true,
          completedBy: true
        }
      },
      AppointmentRouting: {
        orderBy: {id: "asc"},
        select: {
          id: true,
          routingCode: true,
          amendment: true,
          routedBy: true,
          routedTo: true,
          routedToRole: true,
          status: true,
          updatedAt: true
        }
      },
      PreAssessmentNotes: {
        where: {
          appointmentId: id,
          orgUid: orgUid
        },
        select: {
          id: true,
          assessment: true,
          remarks: true,
          homeInstructions: true,
          createdBy: true,
          PreConsultationNoteAttribute: {}
        }
      },
      ConsultationTickets: {
        where: {
          appointmentId: id,
          orgUid: orgUid
        },
        select: {
          id: true,
          updatedAt: true,
          ConsultationTicketAuthors: true,
          subject: true,
          ConsultationTicketAttribute: {
            select: {
              noteTemplateName: true
            }
          }
        }
      }
    }
  });
  return {
    status: true,
    message: "Appointment fetched",
    data: appointment
  };
});

export type GetAppointmentCounts = Awaited<ReturnType<typeof getAppointmentCountsAction>>;
export const getAppointmentCountsAction = cache(async (orgUid: string) => {
  const session = await getCachedSession();
  if (!session || !session.accessToken)
    return {
      status: false,
      message: "Unauthorized"
    };

  const permissions = await getPermissionsAction(session.user.sub);
  const userPermissionArray = permissions.map(p => p.name);
  
  const readAllOrgAppointmentPermission = ["read:org:appointment:all"];
  const readAOwnOrgAppointmentPermission = ["read:org:appointment:own"];
  const readAssignedOrgAppointmentPermission = ["read:org:appointment:assigned"];
  
  const readAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))

  const counts = await prismaTenant.appointmentAttribute.groupBy({
    by: ["status"],
    where: {
      Appointment: {
        isActive: true,
        OR: [
          { ...(readAllOrgAppointment ? { orgUid } : {}) },
          { ...(readAOwnOrgAppointment ? { Requesters: { some: { userId: session.user.sub } } } : {}) },
          { ...(readAssignedOrgAppointment ? {
            AppointmentRouting: {
              some: {
                OR: [
                  { routedTo: session.user.sub },
                  { routedBy: session.user.sub }
                ]
              }
            }
          } : {}) },
        ]
      }
    },
    _count: true
  });

  const countsMap = counts.reduce((acc, count) => {
    if (acc["ALL"] === undefined) {
      acc["ALL"] = 0;
    }
    acc[count.status] = count._count;
    acc["ALL"] += count._count ?? 0;
    return acc;
  }, {} as Record<string, number>);
  return {
    status: true,
    message: "Appointment counts fetched",
    data: countsMap
  };
});

export const getRoutedAppointmentCountsAction = cache(async (orgUid: string) => {
  const session = await getCachedSession();
  if (!session || !session.accessToken)
    return {
      status: false,
      message: "Unauthorized"
    };
  const permissions = await getPermissionsAction(session.user.sub);
  const userPermissionArray = permissions.map(p => p.name);
    
  const readAllOrgAppointmentPermission = ["read:org:appointment:all"];
  const readAOwnOrgAppointmentPermission = ["read:org:appointment:own"];
  const readAssignedOrgAppointmentPermission = ["read:org:appointment:assigned"];
    
  const readAllOrgAppointment = readAllOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAOwnOrgAppointment = readAOwnOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  const readAssignedOrgAppointment = readAssignedOrgAppointmentPermission.every(p => userPermissionArray.includes(p))
  
  const counts = await prismaTenant.appointmentRouting.groupBy({
    by: ["status"],
    where: {
      Appointment: {
        isActive: true,
        AppointmentAttribute: {
          status: {
            in: ["ROUTED"]
          }
        },
        OR: [
          { ...(readAllOrgAppointment ? { orgUid } : {}) },
          { ...(readAOwnOrgAppointment ? { Requesters: { some: { userId: session.user.sub } } } : {}) },
          { ...(readAssignedOrgAppointment ? {
            AppointmentRouting: {
              some: {
                OR: [
                  { routedTo: session.user.sub },
                  { routedBy: session.user.sub }
                ]
              }
            }
          } : {}) },
        ]
      }
    },
    _count: true,
  });

  const countsMap = counts.reduce((acc, count) => {
    if (acc["ALL"] === undefined) {
      acc["ALL"] = 0;
    }
    acc[count.status] = count._count;
    acc["ALL"] += count._count ?? 0;
    return acc;
  }, {} as Record<string, number>);
  return {
    status: true,
    message: "Appointment counts fetched",
    data: countsMap
  };
});

type RescheduleAppointmentPayload = {
  appointmentId: number;
  startDateTime: string;
  endDateTime: string;
  date: string;
  hpId: string;
  hpRole: string;
  assign: boolean;
};
export const rescheduleAppointmentAction = async ({ appointmentId, startDateTime, endDateTime, date, hpId, hpRole, assign }:RescheduleAppointmentPayload ) => {
  const session = await getCachedSession();
  if (!session) {
    return {
      status: false,
      message: "Unauthorized"
    };
  }
  try {
    await prismaTenant.$transaction(async (prisma) => {
      await prisma.appointmentAttribute.update({
        where: {
          appointmentId,
          Appointment: {
            isActive: true
          }
        },
        data: {
          date: dayjs(date).endOf("day").toDate(),
          timeStart: startDateTime,
          timeEnd: endDateTime,
          rescheduledAt: new Date(),
          rescheduledBy: session.user.sub,
          ...assign ? { status: "ROUTED" } : {}
        }
      });
      if(assign) {
        await prisma.appointmentRouting.create({
          data: {
            appointmentId,
            routedBy: session.user.sub,
            routedTo: hpId,
            routedToRole: hpRole,
            status: "PENDING"
          }
        });
      }
    }, {
      timeout: 5000,
      maxWait: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
    return {
      status: true,
      message: "Appointment rescheduled"
    }
  } catch (error) {
    console.error(error);
    let errorMsg = "Failed to reschedule appointment";
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      errorMsg = "Appointment not found or you are not authorized to reschedule it";
    }
    return {
      status: false,
      message: errorMsg
    }
  }
};

