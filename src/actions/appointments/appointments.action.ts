"use server";

import { delay } from "@lib/wait";
import prismaTenant from "@lib/prisma-tenant";
import { AppointmentStatus, appointmentList } from "@public/json/appointment-list";
import 'server-only'

export type AppointmentsCountsType = Awaited<ReturnType<typeof getAppointmentCounts>>;
export const getAppointmentCounts = async () => {
  const appointmentsCounts = {
    all: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    rejected: 0,
    received: 0,
    routed: 0,
    reschedule: 0,
  }
  appointmentList.forEach((item) => {
    // count each status and increment the count
    appointmentsCounts[item.status as keyof typeof appointmentsCounts ]++;
    appointmentsCounts.all++;
  });
  return appointmentsCounts;
}

export type GetAppointmentFilter = {
  orgUid?: string;
  status?: AppointmentStatus;
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
  const { orgUid, status } = filter || {};

  const appointments = await prismaTenant.appointment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      ...status ? { AppointmentAttribute: {status} } : {},
      ...orgUid ? { orgUid } : {}
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

export const sendMsgAction = async(formData: FormData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(Object.fromEntries(formData));
}


export const acceptAppointmentAction = async (formData: FormData) => {
  console.log("Accepting appointment...");
  await delay(1000);
  return true;
}

export const rejectAppointmentAction = async (formData: FormData) => {
  console.log("Rejecting appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}

export const receiveAppointmentAction = async (formData: FormData) => {
  console.log("Receiving appointment...");
  await delay(1000);
  return true;
}

export const assignAppointmentAction = async (formData: FormData) => {
  console.log("Assigning appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}

export const rescheduleAppointmentAction = async (formData: FormData) => {
  console.log("Reschedule appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}