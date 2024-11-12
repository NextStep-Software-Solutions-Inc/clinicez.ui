"use server";
import "server-only";
import prisma from "@lib/prisma";

export type UpsertUserScheduleArgs = {
  id: number;
  type: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  pattern?: string;
  daysOfWeek?: number[];
  weekOfMonth?: number[];
  userId: string;
};
export const upsertBaseUserScheduleAction = async (args: UpsertUserScheduleArgs) => {
  const { id, type, startDate, endDate, startTime, endTime, isRecurring, pattern, daysOfWeek, weekOfMonth, userId } = args;
  const userSchedule = await prisma.userSchedule.upsert({
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
  return await prisma.userSchedule.findMany({
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

export type GetUserAppointmentsSchedule = Awaited<ReturnType<typeof getHPAppointmentsSchedule>>;
export const getHPAppointmentsSchedule = async (hpId: number) => {
  return await prisma.appointment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      isActive: true,
      OR: [
        {
          AppointmentAttribute: {
            status: {
              notIn: ["COMPLETED", "REJECTED"]
            },
            preferredAppointee: hpId,
            date: {
              gte: new Date()
            },
          }
        },
        {
          AppointmentRouting: {
            some: {
              routedTo: hpId,
              status: {
                in: ["DECLINED", "CANCELLED"]
              }
            }
          }
        }
      ]
      
    },
    select: {
      id: true,
      Requesters: {
        select: {
          userId: true,
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
  await prisma.userSchedule.delete({
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