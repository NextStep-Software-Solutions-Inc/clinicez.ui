"use server";
import 'server-only'

import { delay } from "@lib/wait";
import prismaTenant from "@lib/prisma-tenant";
import { RoutedAptStatus, AppointmentStatus } from "@public/json/appointment-list";

export type GetAppointmentFilter = {
  orgUid?: string;
  status?: AppointmentStatus;
  routedAptStatus?: RoutedAptStatus
  appointmentId?: number
}

type CreateAppointmentPayload = {
  orgUid: string;
  subject: string;
  complaint?: string;
  modeId: number;
  typeId: number;
  requesters: string[]
}
export const createAppointmentAction = async ({orgUid, subject, complaint, requesters, modeId, typeId}:CreateAppointmentPayload) => {

  const newAppointment = await prismaTenant.appointment.create({
    data: {
      subject,
      complaint,
      orgUid,
      AppointmentAttribute: {
        create: {
          modeId,
          typeId,
        }
      },
      Requesters: {
        createMany: {
          data: requesters.map((email) => ({email})),
          skipDuplicates: true
        }
      }
    }
  })
  return newAppointment
}


export type GetAppointments = Awaited<ReturnType<typeof getAppointmentsAction>>;
export const getAppointmentsAction = async (filter?: GetAppointmentFilter) => {
  const { orgUid, status, routedAptStatus } = filter || {};

  const appointments = await prismaTenant.appointment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      ...status ? { AppointmentAttribute: {status} } : {},
      ...orgUid ? { orgUid } : {},
      ...routedAptStatus ? {
        AppointmentRouting: {
          some: {
            status: routedAptStatus
          }
        }
      } : {}
    },
    select: {
      id: true,
      subject: true,
      complaint: true,
      createdAt: true,
      Requesters: {
        select: {
          email: true,
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
  return appointments;
}

export type GetAppointment = Awaited<ReturnType<typeof getAppointmentAction>>;
export const getAppointmentAction = async (id: number) => {
  const appointment = await prismaTenant.appointment.findUnique({
    where: {
      isActive: true,
      id
    },
    select: {
      id: true,
      subject: true,
      complaint: true,
      createdAt: true,
      Requesters: {
        select: {
          email: true,
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
          status: true,
          Service: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })
  return appointment;
}

export type GetAppointmentCounts = Awaited<ReturnType<typeof getAppointmentCountsAction>>;
export const getAppointmentCountsAction = async (orgUid: string) => {
  const counts = await prismaTenant.appointmentAttribute.groupBy({
    by: ['status'],
    where: {
      Appointment: {
        orgUid
      }
    }, 
    _count: true
  });

  const countsMap = counts.reduce((acc, count) => {
    acc[count.status] = count._count
    return acc;
  }, {} as Record<string, number>)
  return countsMap;
}

export const getRoutedAppointmentCountsAction = async (orgUid: string) => {
  const counts = await prismaTenant.appointmentRouting.groupBy({
    by: ['status'],
    where: {
      Appointment: {
        orgUid
      }
    }, 
    _count: true
  });

  const countsMap = counts.reduce((acc, count) => {
    acc[count.status] = count._count
    return acc;
  }, {} as Record<string, number>)
  return countsMap;
}

export const sendMsgAction = async(formData: FormData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(Object.fromEntries(formData));
}


export const acceptAppointmentAction = async (formData: FormData) => {
  console.log("Accepting appointment...");
  await delay(1000);
  return true;
}




export const rescheduleAppointmentAction = async (formData: FormData) => {
  console.log("Reschedule appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}