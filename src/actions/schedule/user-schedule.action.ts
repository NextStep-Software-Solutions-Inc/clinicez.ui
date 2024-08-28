"use server";
import "server-only";

import prismaCommon from "@lib/prisma-common";
import prismaTenant from "@lib/prisma-tenant";

export type UpsertUserScheduleArgs = {
  id: number;
  type: string;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  pattern?: string;
  daysOfWeek?: number[];
  weekOfMonth?: number[];
  userId: string;
};
export const upsertBaseUserScheduleAction = async (args: UpsertUserScheduleArgs) => {
  const { id, type, startDate, endDate, startTime, endTime, isRecurring, pattern, daysOfWeek, weekOfMonth, userId } = args;
  const userSchedule = await prismaCommon.userSchedule.upsert({
    where: {
      User: { userId },
      id
    },
    update: {
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      isRecurring,
      pattern,
      daysOfWeek,
      weekOfMonth
    },
    create: {
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      isRecurring,
      pattern,
      daysOfWeek,
      weekOfMonth,
      User: {
        connect: { userId }
      }
    }
  });
  return {
    status: true,
    message: "User schedule has been updated",
    data: userSchedule
  }
}

export type GetUserSchedules = Awaited<ReturnType<typeof getUserSchedulesAction>>;
export const getUserSchedulesAction = async (unique: string) => {
  return await prismaCommon.userSchedule.findMany({
    where: {
      OR: [
        {
          User: { email: unique }
        }, 
        {
          User: { userId: unique }
        }
      ]
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

export const deleteUserScheduleAction = async (id: number) => {
  await prismaCommon.userSchedule.delete({
    where: {
      id,
      isActive: true
    }
  });
  return {
    status: true,
    message: "User schedule has been deleted"
  }
}