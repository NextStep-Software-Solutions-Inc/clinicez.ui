"use server";
import "server-only";

import { delay } from "@lib/wait";
import { decode } from "jsonwebtoken";
import prismaTenant from "@lib/prisma-tenant";
import {
  RoutedAptStatus,
  AppointmentStatus
} from "@public/json/appointment-list";
import { getCachedSession } from "@actions/session.action";

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
  const hasPermission = checkUserPermission(session.accessToken);

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
      AppointmentAttribute: { ...(status !== "ALL" ? { status } : {}) },
      ...(routedAptStatus
        ? {
          AppointmentRouting: {
            some: { status: routedAptStatus }
          }
        }
        : {}),
      OR: [
        { ...(hasPermission ? { orgUid } : {}) },
        { Requesters: { some: { email: session.user.email } } },
        {
          AppointmentRouting: {
            some: {
              OR: [
                { routedTo: session.user.email },
                { routedBy: session.user.email }
              ]
            }
          }
        }
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
          ConsultationRecords: true
        }
      },
      AppointmentAttribute: {
        select: {
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

  const appointment = await prismaTenant.appointment.findUnique({
    where: {
      isActive: true,
      ...(orgUid ? { orgUid } : {}),
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
        select: {
          id: true,
          amendment: true,
          routedBy: true,
          routedTo: true,
          status: true,
          updatedAt: true
        }
      },
      PreConsultationNotes: {
        where: {
          appointmentId: id,
          orgUid: orgUid,
          createdBy: session.user.email
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
      ConsultationRecords: {
        where: {
          appointmentId: id,
          orgUid: orgUid
        },
        select: {
          id: true,
          updatedAt: true,
          createdBy: true,
          subject: true,
          ConsultationRecordAttribute: {
            select: {
              template: true
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

  const hasPermission = checkUserPermission(session.accessToken);

  const counts = await prismaTenant.appointmentAttribute.groupBy({
    by: ["status"],
    where: {
      Appointment: {
        orgUid,
        OR: [
          { ...(hasPermission ? { orgUid } : {}) },
          { Requesters: { some: { email: session.user.email } } },
          {
            AppointmentRouting: {
              some: {
                OR: [
                  { routedTo: session.user.email },
                  { routedBy: session.user.email }
                ]
              }
            }
          }
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
  const hasPermission = checkUserPermission(session.accessToken);

  const counts = await prismaTenant.appointmentRouting.groupBy({
    by: ["status"],
    where: {
      Appointment: {
        orgUid,
        OR: [
          { ...(hasPermission ? { orgUid } : {}) },
          { Requesters: { some: { email: session.user.email } } },
          {
            AppointmentRouting: {
              some: {
                OR: [
                  { routedTo: session.user.email },
                  { routedBy: session.user.email }
                ]
              }
            }
          }
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

function checkUserPermission(
  accessToken: string,
  permissions: string[] = []
): boolean {
  if (permissions.length === 0) return true;
  return permissions.every((permission) =>
    parseAccessToken(accessToken, "permissions").includes(permission)
  );
}

// lets create a function that parse the accessToken to get the permission claims
function parseAccessToken(accessToken: string, claim: string): string[] {
  const payload = decode(accessToken, {
    json: true
  });
  if (payload && claim in payload) {
    return payload[claim];
  }
  return [];
}
