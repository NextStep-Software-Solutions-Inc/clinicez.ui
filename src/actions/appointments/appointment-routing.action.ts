"use server";

import { getCachedSession } from '@actions/session.action';
import prisma from '@lib/prisma';
import { Prisma } from "@prisma/client"
import { hasCodeProperty } from '@lib/utils';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { withErrorHandling } from '@/lib/with-error-handling';

// Active routing statuses that prevent appointment reassignment
const ACTIVE_ROUTING_STATUSES: Array<'PENDING' | 'ACCEPTED'> = ['PENDING', 'ACCEPTED'];

/**
 * Helper function to update appointment status when all assignments are in terminal states
 * @param prisma - Prisma transaction client
 * @param appointmentId - The appointment ID to check and update
 * @param allRoutings - All routing records for this specific appointment (not other appointments)
 */
async function updateAppointmentStatusIfNeeded(
  prisma: Prisma.TransactionClient,
  appointmentId: number,
  allRoutings: Array<{ status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' }>
) {
  // Check if all routing assignments are now in a terminal state (DECLINED or CANCELLED)
  // If so, update the appointment status back to RECEIVED to allow reassignment
  const hasActiveAssignment = allRoutings.some(r =>
    ACTIVE_ROUTING_STATUSES.includes(r.status as 'PENDING' | 'ACCEPTED')
  );

  if (!hasActiveAssignment) {
    await prisma.appointmentAttribute.update({
      where: { appointmentId },
      data: { status: 'RECEIVED' }
    });
  }
}

type AssignAppointmentPayload = {
  routedTo: number;
  appointmentId: number;
}
export const assignAppointmentAction = withErrorHandling(async (data: AssignAppointmentPayload) => {

  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');

  const { routedTo, appointmentId } = data;
  if (!routedTo || !appointmentId) throw new Error('Invalid data provided');

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: 'CLINIC' });
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const assignAppointmentPermissions = [PERMISSIONS.CLINIC["ASSIGN:CLINIC:APPOINTMENT"].name]
  const canAssignAppointment = assignAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if (!canAssignAppointment) throw new Error('You do not have permission to assign appointment');

  // Get the healthcare provider details and check HP type
  const healthcareProvider = await prisma.healthcareProvider.findUnique({
    where: { id: routedTo },
    select: {
      id: true,
      hpTypeId: true,
      User: {
        select: {
          UserPreference: {
            select: {
              autoAcceptAppointmentAssignment: true
            }
          }
        }
      }
    }
  });

  if (!healthcareProvider) {
    throw new Error('Healthcare provider not found');
  }

  // One active assignment per HP role — block if an active routing already exists for this role
  const activeRoutingForRole = await prisma.appointmentRouting.findFirst({
    where: {
      appointmentId,
      status: { in: ['PENDING', 'ACCEPTED'] },
      RoutedTo: { hpTypeId: healthcareProvider.hpTypeId },
    },
    select: { id: true, RoutedTo: { select: { HPType: { select: { name: true } } } } },
  });

  if (activeRoutingForRole) {
    const roleName = activeRoutingForRole.RoutedTo.HPType?.name ?? 'this role';
    throw new Error(`An active assignment for ${roleName} already exists. It must be declined or completed first.`);
  }

  const autoAccept = healthcareProvider.User?.UserPreference?.autoAcceptAppointmentAssignment ?? false;

  await prisma.$transaction(async (prisma) => {
    await prisma.appointmentRouting.create({
      data: {
        RoutedBy: {
          connect: {
            userId: session.user.sub
          }
        },
        RoutedTo: {
          connect: {
            id: routedTo
          }
        },
        Appointment: {
          connect: {
            id: appointmentId
          }
        },
        status: autoAccept ? 'ACCEPTED' : 'PENDING',
      }
    })

    await prisma.appointmentAttribute.update({
      where: { appointmentId },
      data: { status: 'ROUTED' }
    })

  },
    {
      timeout: 5000,
      maxWait: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })
  return { message: `Appointment assigned`, data: null };
}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return 'Appointment not found or you are not authorized to assign it';
})

export const acceptAppointmentAction = withErrorHandling(async (formData: FormData) => {

  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: 'CLINIC' });
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const acceptAppointmentPermissions = [PERMISSIONS.CLINIC["ACCEPT:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canAcceptAppointment = acceptAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if (!canAcceptAppointment) throw new Error('You do not have permission to accept appointment');

  const routingCode = formData.get('routingCode') as string;

  await prisma.appointmentRouting.update({
    where: {
      routingCode,
      status: {
        not: 'ACCEPTED'
      }
    },
    data: { status: 'ACCEPTED' }
  })

  return { message: 'Appointment accepted', data: undefined };
}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return 'Appointment assignment not found or you are not authorized to accept it';
})

export const declineAppointmentAction = withErrorHandling(async (formData: FormData) => {

  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: 'CLINIC' });
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const declineAppointmentPermissions = [PERMISSIONS.CLINIC["DECLINE:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canDeclineAppointment = declineAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if (!canDeclineAppointment) throw new Error('You do not have permission to decline appointment');

  const reason = formData.get('reason') as string;
  const routingCode = formData.get('routingCode') as string;

  await prisma.$transaction(async (prisma) => {
    // Update the routing status to DECLINED
    const updatedRouting = await prisma.appointmentRouting.update({
      where: { routingCode },
      data: {
        status: 'DECLINED',
        amendedAt: new Date(),
        AmendedBy: {
          connect: {
            userId: session.user.sub
          }
        },
        amendment: reason
      },
      select: {
        appointmentId: true,
        Appointment: {
          select: {
            AppointmentRouting: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });

    // Update appointment status if all assignments are declined/cancelled
    await updateAppointmentStatusIfNeeded(
      prisma,
      updatedRouting.appointmentId,
      updatedRouting.Appointment!.AppointmentRouting as Array<{ status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' }>
    );
  }, {
    timeout: 5000,
    maxWait: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });

  return { message: `Appointment assignment declined with reason: ${reason}`, data: undefined };
}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return 'Appointment assignment not found or you are not authorized to decline it';
})

export const cancelAppointmentRoutingAction = withErrorHandling(async ({ appointmentRoutingId, reason }: { appointmentRoutingId: number; reason: string }) => {

  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');

  if (!reason?.trim()) throw new Error('A reason is required to cancel an assignment');

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: 'CLINIC' });
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const cancelAppointmentRouting = [PERMISSIONS.CLINIC["CANCEL:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canCancelAppointment = cancelAppointmentRouting.every(permission => myPermissionArray.includes(permission));

  if (!canCancelAppointment) throw new Error('You do not have permission to cancel appointment assignment');

  await prisma.$transaction(async (prisma) => {
    // Update the routing status to CANCELLED
    const updatedRouting = await prisma.appointmentRouting.update({
      where: {
        id: appointmentRoutingId,
        RoutedBy: {
          userId: session.user.sub
        },
        status: {
          in: ["PENDING"]
        }
      },
      data: {
        status: 'CANCELLED',
        AmendedBy: {
          connect: {
            userId: session.user.sub
          }
        },
        amendedAt: new Date(),
        amendment: reason.trim()
      },
      select: {
        appointmentId: true,
        Appointment: {
          select: {
            AppointmentRouting: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });

    // Update appointment status if all assignments are declined/cancelled
    await updateAppointmentStatusIfNeeded(
      prisma,
      updatedRouting.appointmentId,
      updatedRouting.Appointment!.AppointmentRouting as Array<{ status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' }>
    );
  }, {
    timeout: 5000,
    maxWait: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });

  return { message: 'Appointment cancelled', data: undefined };
}, async error => {
  if (hasCodeProperty(error) && error.code === 'P2025') return 'Appointment assignment not found or you are not authorized to cancel it';
})

/**
 * Returns an accepted appointment assignment back to the assigner.
 * 
 * Required Permission: return:clinic:appointment_assignment
 * 
 * This action allows nurses/staff to return an appointment that was previously accepted
 * (either manually or auto-accepted) back to the pool for reassignment. This is useful
 * when a healthcare provider needs to handle an emergency or decides not to proceed.
 * 
 * @param formData - Contains:
 *   - appointmentRoutingId: ID of the AppointmentRouting record to return
 *   - reason: Required reason for returning the assignment
 * 
 * @returns Success message with the reason, or error message
 * 
 * @throws Error if:
 *   - User lacks permission
 *   - Reason is missing or empty
 *   - AppointmentRouting ID is invalid
 *   - AppointmentRouting not found or not in ACCEPTED status
 */
export const returnAppointmentAssignmentAction = withErrorHandling(async (formData: FormData) => {

  const session = await getCachedSession();
  if (!session) throw new Error('Unauthorized');

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: 'CLINIC' });
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const returnAppointmentPermissions = [PERMISSIONS.CLINIC["RETURN:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canReturnAppointment = returnAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if (!canReturnAppointment) throw new Error('You do not have permission to return appointment assignment');

  const reason = formData.get('reason') as string;
  const appointmentRoutingId = Number(formData.get('appointmentRoutingId'));

  if (!reason || !reason.trim()) {
    throw new Error('Reason is required to return an appointment assignment');
  }

  if (isNaN(appointmentRoutingId) || appointmentRoutingId <= 0) {
    throw new Error('Invalid appointment routing ID');
  }

  await prisma.$transaction(async (prisma) => {
    // Update the routing status to CANCELLED with return information
    const updatedRouting = await prisma.appointmentRouting.update({
      where: {
        id: appointmentRoutingId,
        status: {
          in: ["ACCEPTED"]
        }
      },
      data: {
        status: 'CANCELLED',
        returnedBy: session.user.id,
        returnedAt: new Date(),
        returnReason: reason
      },
      select: {
        appointmentId: true,
        Appointment: {
          select: {
            AppointmentRouting: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });

    // Update appointment status if all assignments are declined/cancelled
    await updateAppointmentStatusIfNeeded(
      prisma,
      updatedRouting.appointmentId,
      updatedRouting.Appointment!.AppointmentRouting as Array<{ status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' }>
    );
  }, {
    timeout: 5000,
    maxWait: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });

  return { message: `Appointment assignment returned with reason: ${reason}`, data: undefined };
}, async (error) => {
  // Handle Prisma errors
  if (hasCodeProperty(error) && error.code === 'P2025') {
    return 'Appointment assignment not found or you are not authorized to return it';
  }
})