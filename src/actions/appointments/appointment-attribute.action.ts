"use server";

import { getCachedSession } from '@actions/session.action';
import prismaClient from '@lib/prisma';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { withErrorHandling } from '@/lib/with-error-handling';

export const receiveAppointmentAction = withErrorHandling(async (formData: FormData) => {
  const session = await getCachedSession();

  if (!session) throw new Error("User not authenticated.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub });
  const receiveAppointmentPermissions = [PERMISSIONS.CLINIC["RECEIVE:CLINIC:APPOINTMENT"].name];
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const canReceiveAppointment = receiveAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

  if (!canReceiveAppointment) throw new Error("You do not have permission to receive appointment.");

  const userPreference = await prismaClient.userPreference.findFirst({
    where: {
      User: {
        userId: session.user.sub,
      }
    },
    select: {
      HealthCareProvider: {
        select: {
          id: true,
          HPType: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      autoAssignAppointmentToSelf: true,
      autoAcceptAppointmentAssignment: true,
    }
  });

  const defaultHp = userPreference?.HealthCareProvider
  const autoAssignToSelf = (userPreference?.autoAssignAppointmentToSelf && !!defaultHp) || false;
  const autoAcceptAppointment = userPreference?.autoAcceptAppointmentAssignment || false;

  const appointmentId = parseInt(formData.get('appointmentId') as string);
  const newStatus = formData.get('status') as string;
  await prismaClient.appointmentAttribute.update({
    where: {
      appointmentId
    },
    data: {
      status: autoAssignToSelf ? "ROUTED" : newStatus,
      receivedAt: new Date(),
      ReceivedBy: {
        connect: {
          userId: session.user.sub
        }
      },
      ...(autoAssignToSelf && {
        Appointment: {
          update: {
            AppointmentRouting: {
              create: {
                RoutedTo: {
                  connect: {
                    id: defaultHp?.id
                  }
                },
                RoutedBy: {
                  connect: {
                    userId: session.user.sub
                  }
                },
                status: (autoAssignToSelf || autoAcceptAppointment) ? "ACCEPTED" : "PENDING",
              }
            }
          }
        }
      })
    }
  })
  return { message: 'Appointment received', data: undefined };
}, async error => {
  if (error instanceof Error) return error.message;
  return "An error occurred while receiving appointment."
})

export const completeAppointmentAction = withErrorHandling(async (formData: FormData) => {
  const session = await getCachedSession();

  if (!session) throw new Error("User not authenticated.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const completeAppointmentPermissions = [PERMISSIONS.CLINIC["COMPLETE:CLINIC:APPOINTMENT"].name];
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const canCompleteAppointment = completeAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

  if (!canCompleteAppointment) throw new Error("You do not have permission to complete appointment.");

  const appointmentId = parseInt(formData.get('appointmentId') as string);
  await prismaClient.appointmentAttribute.update({
    where: {
      appointmentId,
      status: {
        not: "COMPLETED"
      }
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      CompletedBy: {
        connect: {
          userId: session.user.sub
        }
      }
    }
  })
  return { message: 'Appointment completed', data: undefined };
}, async error => {
  if (error instanceof Error) return error.message;
  return "An error occurred while completing appointment."
})

export const rejectAppointmentAction = withErrorHandling(async (formData: FormData) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub });
  const rejectAppointmentPermissions = [PERMISSIONS.CLINIC["REJECT:CLINIC:APPOINTMENT"].name];
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const canRejectAppointment = rejectAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

  if (!canRejectAppointment) throw new Error("You do not have permission to reject appointment.");

  const appointmentId = parseInt(formData.get('appointmentId') as string);
  const reason = formData.get('reason') as string;

  await prismaClient.appointmentAttribute.update({
    where: {
      appointmentId,
      status: {
        not: "REJECTED"
      }
    },
    data: {
      status: "REJECTED",
      rejectedReason: reason,
      rejectedAt: new Date(),
      RejectedBy: {
        connect: {
          userId: session.user.sub
        }
      }
    }
  })
  return { message: 'Appointment rejected', data: undefined };

}, async error => {
  if (error instanceof Error) return error.message;
  return "An error occurred while rejecting appointment."
})