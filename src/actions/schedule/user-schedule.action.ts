"use server";
import "server-only";
import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";

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
export const upsertUserScheduleAction = withErrorHandling(async (args: UpsertUserScheduleArgs) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

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
  return { message: "User schedule has been updated", data: userSchedule }
})

export type GetUserSchedules = Awaited<ReturnType<typeof getUserSchedulesAction>>;
export const getUserSchedulesAction = withErrorHandling(async (unique: string) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  const useSchedules = await prisma.userSchedule.findMany({
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
  return { message: "User schedules", data: useSchedules }
})

export type GetUserAppointmentsSchedule = Awaited<ReturnType<typeof getHPAppointmentsSchedule>>;
export const getHPAppointmentsSchedule = withErrorHandling( async (hpId: number) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  const hpAppointmentSchedule = await prisma.appointment.findMany({
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
  return { message: "Healthcare provider appointments schedule", data: hpAppointmentSchedule }
})

export const deleteUserScheduleAction = withErrorHandling(async (id: number) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  await prisma.userSchedule.delete({
    where: {
      id,
      isActive: true
    }
  });
  return {  message: "User schedule has been deleted", data: null }
})