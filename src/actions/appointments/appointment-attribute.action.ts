"use server";

import { getCachedSession } from '@actions/session.action';
import prismaClient from '@lib/prisma';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { withErrorHandling } from '@/lib/with-error-handling';
import { hasCodeProperty } from '@lib/utils';

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
      appointmentId,
      receivedBy: null,  // Atomic lock: only proceed if not yet received
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
  if (hasCodeProperty(error) && error.code === 'P2025') {
    return "This appointment is already being handled by another staff member. Please refresh to see the current status.";
  }
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

  await prismaClient.$transaction(async (tx) => {
    // Cancel any remaining PENDING or ACCEPTED routings before marking complete
    await tx.appointmentRouting.updateMany({
      where: { appointmentId, status: { in: ["PENDING", "ACCEPTED"] } },
      data: { status: "CANCELLED", amendedAt: new Date(), amendment: "Appointment completed" },
    });

    await tx.appointmentAttribute.update({
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
    });
  });

  return { message: 'Appointment completed', data: undefined };
}, async error => {
  if (error instanceof Error) return error.message;
  return "An error occurred while completing appointment."
})

type ConfirmAppointmentBookingPayload = {
  appointmentId: number;
  modeId: number;
  typeId: number;
  serviceId: number;
  hpId?: number;
  date?: Date;
  timeStart?: string;
  timeEnd?: string;
};

export const confirmAppointmentBookingAction = withErrorHandling(async (payload: ConfirmAppointmentBookingPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub });
  const requiredPermissions = [PERMISSIONS.CLINIC["RECEIVE:CLINIC:APPOINTMENT"].name];
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const canReceiveAppointment = requiredPermissions.some(permission => myPermissionArray.includes(permission));

  if (!canReceiveAppointment) throw new Error("You do not have permission to confirm appointment booking.");

  const { appointmentId, modeId, typeId, serviceId, hpId, date, timeStart, timeEnd } = payload;

  await prismaClient.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { userId: session.user.sub },
      select: { id: true },
    });

    await tx.appointmentAttribute.update({
      where: { appointmentId },
      data: {
        modeId,
        typeId,
        serviceId,
        date,
        timeStart,
        timeEnd,
        status: hpId ? "ROUTED" : "RECEIVED",
        receivedAt: new Date(),
        receivedBy: user.id,
      },
    });

    if (hpId) {
      await tx.appointmentRouting.create({
        data: {
          RoutedBy: { connect: { userId: session.user.sub } },
          RoutedTo: { connect: { id: hpId } },
          Appointment: { connect: { id: appointmentId } },
          status: "PENDING",
        },
      });
    }
  });

  return { message: "Appointment booking confirmed", data: undefined };
}, async (error) => {
  if (error instanceof Error) return error.message;
  return "An error occurred while confirming appointment booking.";
});

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
  if (error instanceof Error) {
    // Translate the Prisma "record not found" error into a user-friendly message
    if (error.message.includes("No record was found") || error.message.includes("depends on one or more records")) {
      return "This appointment has already been rejected or no longer exists.";
    }
    return error.message;
  }
  return "An error occurred while rejecting appointment."
})

export const cancelAppointmentAction = withErrorHandling(async (formData: FormData) => {

  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub });
  const rejectAppointmentPermissions = [PERMISSIONS.CLINIC["REJECT:CLINIC:APPOINTMENT"].name];
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const canCancel = rejectAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

  if (!canCancel) throw new Error("You do not have permission to cancel this appointment.");

  const appointmentId = parseInt(formData.get('appointmentId') as string);
  const reason = formData.get('reason') as string;

  await prismaClient.appointmentAttribute.update({
    where: {
      appointmentId,
      status: {
        notIn: ["REJECTED", "CANCELLED", "COMPLETED"]
      }
    },
    data: {
      status: "CANCELLED",
      rejectedReason: reason,
      rejectedAt: new Date(),
      RejectedBy: {
        connect: {
          userId: session.user.sub
        }
      }
    }
  });
  return { message: 'Appointment cancelled', data: undefined };

}, async error => {
  if (error instanceof Error) {
    if (error.message.includes("No record was found") || error.message.includes("depends on one or more records")) {
      return "This appointment has already been cancelled or no longer exists.";
    }
    return error.message;
  }
  return "An error occurred while cancelling the appointment.";
})

type RescheduleAppointmentPayload = {
  appointmentId: number;
  date: Date;
  timeStart?: string;
  timeEnd?: string;
  newHpId?: number;
};

export const rescheduleAppointmentAction = withErrorHandling(async (payload: RescheduleAppointmentPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub });
  const requiredPermissions = [PERMISSIONS.CLINIC["RECEIVE:CLINIC:APPOINTMENT"].name];
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const canReschedule = requiredPermissions.some(permission => myPermissionArray.includes(permission));

  if (!canReschedule) throw new Error("You do not have permission to reschedule this appointment.");

  const { appointmentId, date, timeStart, timeEnd, newHpId } = payload;

  await prismaClient.$transaction(async (tx) => {
    await tx.appointmentAttribute.update({
      where: { appointmentId },
      data: {
        date,
        ...(timeStart ? { timeStart } : {}),
        ...(timeEnd ? { timeEnd } : {}),
      },
    });

    if (newHpId) {
      // Cancel any existing active (PENDING or ACCEPTED) routings for this appointment
      await tx.appointmentRouting.updateMany({
        where: { appointmentId, status: { in: ["PENDING", "ACCEPTED"] } },
        data: {
          status: "CANCELLED",
          amendedAt: new Date(),
          amendment: "Rescheduled to a new provider",
        },
      });

      // Create new routing to the selected HP
      const newHp = await tx.healthcareProvider.findUnique({
        where: { id: newHpId },
        select: { User: { select: { UserPreference: { select: { autoAcceptAppointmentAssignment: true } } } } },
      });
      const autoAccept = newHp?.User?.UserPreference?.autoAcceptAppointmentAssignment ?? false;

      await tx.appointmentRouting.create({
        data: {
          RoutedBy: { connect: { userId: session.user.sub } },
          RoutedTo: { connect: { id: newHpId } },
          Appointment: { connect: { id: appointmentId } },
          status: autoAccept ? "ACCEPTED" : "PENDING",
        },
      });

      // Ensure appointment is in ROUTED status (new HP assignment pending)
      await tx.appointmentAttribute.update({
        where: { appointmentId },
        data: { status: "ROUTED" },
      });
    }
  });

  return { message: "Appointment rescheduled", data: undefined };
}, async (error) => {
  if (error instanceof Error) return error.message;
  return "An error occurred while rescheduling the appointment.";
});