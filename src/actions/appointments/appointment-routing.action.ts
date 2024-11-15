"use server";

import 'server-only'
import { getCachedSession } from '@actions/session.action';
import prisma from '@lib/prisma';
import { Prisma } from "@prisma/client"
import { hasCodeProperty } from '@lib/utils';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';

type AssignAppointmentPayload = {
  routedTo: number;
  appointmentId: number;
}
export const assignAppointmentAction = async (data: AssignAppointmentPayload) => {
  const session = await getCachedSession();
  try {
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
    return {
      status: true,
      message: `Appointment assigned to ${routedTo}`
    };
  } catch (error) {
    console.error(error);
    let errorMsg = 'Failed to assign appointment';
    if(error instanceof Error) {
      errorMsg = error.message;
    }
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      errorMsg = 'Appointment not found or you are not authorized to assign it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}

export const acceptAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  
  try {
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

    return {
      status: true,
      message: 'Appointment accepted'
    };
  } catch (error) {
    console.error(`Error accepting appointment assignment: ${error}`);
    let errorMsg = 'Failed to accept appointment assignment';
    if(error instanceof Error) {
      errorMsg = error.message;
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      errorMsg = 'Appointment assignment not found or you are not authorized to accept it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}

export const declineAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  
  const reason = formData.get('reason') as string;
  const routingCode = formData.get('routingCode') as string;
  
  try {
    if(!session) throw new Error('Unauthorized');

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: 'CLINIC'});
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const declineAppointmentPermissions = [PERMISSIONS.CLINIC["DECLINE:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
    const canDeclineAppointment = declineAppointmentPermissions.every(permission => myPermissionArray.includes(permission));

    if(!canDeclineAppointment) throw new Error('You do not have permission to decline appointment');

    await prisma.appointmentRouting.update({
      where: { routingCode },
      data: { 
        status: 'DECLINED',
        amendedAt: new Date(),
        amendedBy: session.user.sub,
        amendment: reason
      },
    })
    return {
      status: true,
      message: `Appointment assignment declined with reason: ${reason}`
    };
  } catch (error) {
    console.error(`Error declining appointment assignment: ${error}`);
    
    let errorMsg = 'Failed to decline appointment assignment';
    if(error instanceof Error) {
      errorMsg = error.message;
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      errorMsg = 'Appointment assignment not found or you are not authorized to decline it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}

export const cancelAppointmentRoutingAction = async (appointmentRoutingId: number) => {
  const session = await getCachedSession();

  try {
    if(!session) throw new Error('Unauthorized');

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: 'CLINIC'});
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const cancelAppointmentRouting = [PERMISSIONS.CLINIC["CANCEL:CLINIC:APPOINTMENT_ASSIGNMENT"].name]
    const canCancelAppointment = cancelAppointmentRouting.every(permission => myPermissionArray.includes(permission));

    if(!canCancelAppointment) throw new Error('You do not have permission to cancel appointment assignment');

    await prisma.appointmentRouting.update({
      where: { 
        id: appointmentRoutingId,
        routedBy: session.user.sub,
        status: {
          in: ["PENDING"]
        }
      },
      data: { 
        status: 'CANCELLED',
        amendedBy: session.user.sub,
        amendedAt: new Date(),
        amendment: 'Cancelled by the assigner'
      },
    })
    return {
      status: true,
      message: 'Appointment cancelled'
    };
  } catch (error) {
    console.error(`Error cancelling appointment assignment: ${error}`);
    let errorMsg = 'Failed to cancel appointment assignment';

    if(error instanceof Error) {
      errorMsg = error.message;
    }
    if(hasCodeProperty(error) && error.code === 'P2025') {
      errorMsg = 'Appointment assignment not found or you are not authorized to cancel it';
    }
    return {
      status: false,
      message: errorMsg
    }
  }
}