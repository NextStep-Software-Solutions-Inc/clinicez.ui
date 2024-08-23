"use server";

import prismaCommon from "@lib/prisma-common";
import prismaTenant from "@lib/prisma-tenant";

export type GetUserSchedule = Awaited<ReturnType<typeof getUserScheduleAction>>;
export const getUserScheduleAction = async (email: string) => {
  return await prismaCommon.userSchedule.findMany({
    where: {
      User: {
        email
      }
    },
  });
}

export type GetHPAppointmentsSchedule = Awaited<ReturnType<typeof getHPAppointmentsSchedule>>;
export const getHPAppointmentsSchedule = async (email: string) => {
  return await prismaTenant.appointment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      isActive: true,
      AppointmentAttribute: {
        preferredAppointee: email,
        date: {
          gte: new Date()
        },
      },
    },
    select: {
      id: true,
      Requesters: {
        select: {
          email: true,
        }
      },
      AppointmentAttribute: {
        select: {
          date: true,
          timeStart: true,
          timeEnd: true,
          status: true,
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
  });
}