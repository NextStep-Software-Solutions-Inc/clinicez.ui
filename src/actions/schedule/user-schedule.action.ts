"use server";
import "server-only";
import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

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

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const myPermissionArray = myPermissions.map(p => p.name);
  const isOwnSchedule = args.userId === session.user.sub;
  const canWriteOwn = [PERMISSIONS.CLINIC["WRITE:CLINIC:SCHEDULE:OWN"].name].some(p => myPermissionArray.includes(p));
  const canWriteAll = [PERMISSIONS.CLINIC["WRITE:CLINIC:SCHEDULE:ALL"].name].some(p => myPermissionArray.includes(p));

  if (isOwnSchedule && !canWriteOwn && !canWriteAll) throw new Error("You do not have permission to manage your schedule.");
  if (!isOwnSchedule && !canWriteAll) throw new Error("You do not have permission to manage other users' schedules.");

  const { id, type, startDate, endDate, startTime, endTime, isRecurring, pattern, daysOfWeek, weekOfMonth, userId } = args;

  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

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
        connect: { id: currentUser.id }
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
export const getHPAppointmentsSchedule = withErrorHandling(async (hpId: number) => {

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

  // Check that the schedule belongs to the user, or the user can manage all schedules
  const schedule = await prisma.userSchedule.findUnique({
    where: { id, isActive: true },
    select: { User: { select: { userId: true } } }
  });
  if (!schedule) throw new Error("Schedule not found.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const myPermissionArray = myPermissions.map(p => p.name);
  const isOwnSchedule = schedule.User.userId === session.user.sub;
  const canWriteOwn = [PERMISSIONS.CLINIC["WRITE:CLINIC:SCHEDULE:OWN"].name].some(p => myPermissionArray.includes(p));
  const canWriteAll = [PERMISSIONS.CLINIC["WRITE:CLINIC:SCHEDULE:ALL"].name].some(p => myPermissionArray.includes(p));

  if (isOwnSchedule && !canWriteOwn && !canWriteAll) throw new Error("You do not have permission to delete your schedule.");
  if (!isOwnSchedule && !canWriteAll) throw new Error("You do not have permission to delete other users' schedules.");

  await prisma.userSchedule.delete({
    where: {
      id,
      isActive: true
    }
  });
  return { message: "User schedule has been deleted", data: null }
})