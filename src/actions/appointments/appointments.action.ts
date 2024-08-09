"use server";
import 'server-only'

import { delay } from "@lib/wait";
import prismaTenant from "@lib/prisma-tenant";
import { RoutedAptStatus, AppointmentStatus } from "@public/json/appointment-list";
import { getCachedSession } from '@actions/session.action';

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

  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };

  const { orgUid, status, routedAptStatus } = filter || {};

  const appointments = await prismaTenant.appointment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      orgUid,
      AppointmentAttribute: { status },
      ...routedAptStatus ? {
        AppointmentRouting: {
          some: { status: routedAptStatus }
        }
      }: {},
      OR: [
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
  return {
    status: true,
    message: 'Appointments fetched',
    data: appointments
  };
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
      },
      AppointmentRouting: {
        select: {
          routedBy: true,
          routedTo: true,
          status: true
        }
      }
    }
  })
  return appointment;
}

export type GetAppointmentCounts = Awaited<ReturnType<typeof getAppointmentCountsAction>>;
export const getAppointmentCountsAction = async (orgUid: string) => {
  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };

  const counts = await prismaTenant.appointmentAttribute.groupBy({
    by: ['status'],
    where: {
      Appointment: {
        orgUid,
        OR: [
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
    acc[count.status] = count._count
    return acc;
  }, {} as Record<string, number>)
  return {
    status: true,
    message: 'Appointment counts fetched',
    data: countsMap
  };
}

export const getRoutedAppointmentCountsAction = async (orgUid: string) => {
  const session = await getCachedSession();
  if(!session) return {
    status: false,
    message: 'Unauthorized'
  };

  const counts = await prismaTenant.appointmentRouting.groupBy({
    by: ['status'],
    where: {
      Appointment: {
        orgUid,
        OR: [
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
    acc[count.status] = count._count
    return acc;
  }, {} as Record<string, number>)
  return {
    status: true,
    message: 'Appointment counts fetched',
    data: countsMap
  };
}

export const sendMsgAction = async(formData: FormData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(Object.fromEntries(formData));
}

export const rescheduleAppointmentAction = async (formData: FormData) => {
  console.log("Reschedule appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}