"use server";

import 'server-only'
import { getCachedSession } from '@actions/session.action';
import prisma from '@lib/prisma';
import { Prisma } from "@prisma/client"
import { hasCodeProperty } from '@lib/utils';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { withErrorHandling } from '@/lib/with-error-handling';

type AssignAppointmentPayload = {
  routedTo: number;
  appointmentId: number;
}
export const assignAppointmentAction = withErrorHandling(async (data: AssignAppointmentPayload) => {
  
  const session = await getCachedSession();
  if(!session) throw new Error('Unauthorized');

  const { routedTo, appointmentId } = data;
  if(!routedTo || !appointmentId) throw new Error('Invalid data provided');

  const myPermissions = await getPermissionsAction({userId: session.user.sub, type: 'CLINIC'});
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const assignAppointmentPermissions = [PERMISSIONS.CLINIC["ASSIGN:CLINIC:APPOINTMENT"].name]
  const canAssignAppointment = assignAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canAssignAppointment) throw new Error('You do not have permission to assign appointment');
    
  const userPreference = await prisma.userPreference.findFirst({
    where: {
      User: {
        userId: session.user.sub
      }
    }
  });

  const autoAccept = userPreference?.autoAcceptAppointmentAssignment ?? false;
    
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
  return { message: `Appointment assigned to ${routedTo}`, data: undefined};
}, error => {
  if(hasCodeProperty(error) && error.code === 'P2025') return 'Appointment not found or you are not authorized to assign it';
  return 'Failed to assign appointment';
})

export const acceptAppointmentAction = withErrorHandling(async (formData: FormData) => {
  
  const session = await getCachedSession();
  if(!session) throw new Error('Unauthorized');

  const myPermissions = await getPermissionsAction({userId: session.user.sub, type: 'CLINIC'});
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const acceptAppointmentPermissions = [PERMISSIONS.CLINIC["ACCEPT:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canAcceptAppointment = acceptAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canAcceptAppointment) throw new Error('You do not have permission to accept appointment');

  const routingCode = formData.get('routingCode') as string;
    
  await prisma.appointmentRouting.update({
    where: { 
      routingCode,
      status: {
        not: 'ACCEPTED'
      }
    },
    data: { status: 'ACCEPTED'}      
  })

  return { message: 'Appointment accepted', data: undefined };
}, error => {
  if(hasCodeProperty(error) && error.code === 'P2025') return 'Appointment assignment not found or you are not authorized to accept it';
  return 'Failed to accept appointment';
})

export const declineAppointmentAction = withErrorHandling(async (formData: FormData) => {
  
  const session = await getCachedSession();
  if(!session) throw new Error('Unauthorized');

  const myPermissions = await getPermissionsAction({userId: session.user.sub, type: 'CLINIC'});
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const declineAppointmentPermissions = [PERMISSIONS.CLINIC["DECLINE:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canDeclineAppointment = declineAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canDeclineAppointment) throw new Error('You do not have permission to decline appointment');

  const reason = formData.get('reason') as string;
  const routingCode = formData.get('routingCode') as string;

  await prisma.appointmentRouting.update({
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
  })
  return { message: `Appointment assignment declined with reason: ${reason}`, data: undefined };
}, error => {
  if(hasCodeProperty(error) && error.code === 'P2025') return 'Appointment assignment not found or you are not authorized to decline it';
  return 'Failed to decline appointment';
})

export const cancelAppointmentRoutingAction = withErrorHandling(async (appointmentRoutingId: number) => {
  
  const session = await getCachedSession();
  if(!session) throw new Error('Unauthorized');

  const myPermissions = await getPermissionsAction({userId: session.user.sub, type: 'CLINIC'});
  const myPermissionArray = myPermissions.map(permission => permission.name);
  const cancelAppointmentRouting = [PERMISSIONS.CLINIC["CANCEL:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
  const canCancelAppointment = cancelAppointmentRouting.every(permission => myPermissionArray.includes(permission));

  if(!canCancelAppointment) throw new Error('You do not have permission to cancel appointment assignment');

  await prisma.appointmentRouting.update({
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
      amendment: 'Cancelled by the assigner'
    },
  })
  return { message: 'Appointment cancelled', data: undefined};
}, error => {
  if(hasCodeProperty(error) && error.code === 'P2025') return 'Appointment assignment not found or you are not authorized to cancel it';
  return 'Failed to cancel appointment assignment';
})