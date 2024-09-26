"use server";
import "server-only";

import { delay } from "@lib/wait";
import prismaTenant from "@lib/prisma-tenant";
import prismaCommon from "@lib/prisma-common";
import {
  RoutedAptStatus,
  AppointmentStatus
} from "@public/json/appointment-list";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";

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
  hpEmail?: string;
  schedule: {
    date: Date;
    timeStart: Date;
    timeEnd: Date;
  };
};
export const createAppointmentAction = async ({
  orgUid,
  subject,
  complaint,
  requesters,
  modeId,
  typeId,
  serviceId,
  attachments,
  hpEmail,
  schedule
}: CreateAppointmentPayload) => {
  const { date, timeStart, timeEnd } = schedule;
  const newAppointment = await prismaTenant.appointment.create({
    data: {
      subject,
      complaint,
      orgUid,
      AppointmentAttribute: {
        create: {
          preferredAppointee: hpEmail,
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
          data: requesters.map((email) => ({ email })),
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
  });
  return newAppointment;
};

export type GetAppointments = Awaited<ReturnType<typeof getAppointmentsAction>>;
export const getAppointmentsAction = async (filter?: GetAppointmentFilter) => {
  const session = await getCachedSession();
  if (!session || !session.accessToken)
    return {
      status: false,
      message: "Unauthorized"
    };

  const { orgUid, status, routedAptStatus, sort } = filter || {};

  const permissions = await getPermissionsAction(session.user.sub);
  const userPermissionArray = permissions.map(p => p.name);
  console.log({userPermissionArray});

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
        { ...(readAOwnOrgAppointment ? { Requesters: { some: { email: session.user.email } } } : {}) },
        { ...(readAssignedOrgAppointment ? {
          AppointmentRouting: {
            some: {
              OR: [
                { routedTo: session.user.email },
                { routedBy: session.user.email }
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
      Requesters: {
        select: {
          email: true
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
};

export type GetAppointment = Awaited<ReturnType<typeof getAppointmentAction>>;
export const getAppointmentAction = async (id: number, orgUid?: string) => {
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
        { ...(readAOwnOrgAppointment ? { Requesters: { some: { email: session.user.email } }, id } : {}) },
        { ...(readAssignedOrgAppointment ? {
          AppointmentRouting: {
            some: {
              OR: [
                { routedTo: session.user.email },
                { routedBy: session.user.email }
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
          email: true
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
          amendment: true,
          routedBy: true,
          routedTo: true,
          routedToRole: true,
          status: true,
          updatedAt: true
        }
      },
      PreConsultationNotes: {
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
          createdBy: true,
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
};

export type GetAppointmentCounts = Awaited<
  ReturnType<typeof getAppointmentCountsAction>
>;
export const getAppointmentCountsAction = async (orgUid: string) => {
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
        orgUid,
        OR: [
          { ...(readAllOrgAppointment ? { orgUid } : {}) },
          { ...(readAOwnOrgAppointment ? { Requesters: { some: { email: session.user.email } } } : {}) },
          { ...(readAssignedOrgAppointment ? {
            AppointmentRouting: {
              some: {
                OR: [
                  { routedTo: session.user.email },
                  { routedBy: session.user.email }
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
};

export const getRoutedAppointmentCountsAction = async (orgUid: string) => {
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
        orgUid,
        OR: [
          { ...(readAllOrgAppointment ? { orgUid } : {}) },
          { ...(readAOwnOrgAppointment ? { Requesters: { some: { email: session.user.email } } } : {}) },
          { ...(readAssignedOrgAppointment ? {
            AppointmentRouting: {
              some: {
                OR: [
                  { routedTo: session.user.email },
                  { routedBy: session.user.email }
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
};

export const sendMsgAction = async (formData: FormData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(Object.fromEntries(formData));
};

export const rescheduleAppointmentAction = async (formData: FormData) => {
  console.log("Reschedule appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
};

