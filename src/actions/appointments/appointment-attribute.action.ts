"use server";
import 'server-only'

import { getCachedSession } from '@actions/session.action';
import prismaTenant from '@lib/prisma-tenant';
import prismaCommon from '@lib/prisma-common';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';

export const receiveAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  
  try {
    if(!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "ORGANIZATION"});
    const receiveAppointmentPermissions = [PERMISSIONS.ORGANIZATION["RECEIVE:ORG:APPOINTMENT"].name];
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const canReceiveAppointment = receiveAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

    if(!canReceiveAppointment) throw new Error("You do not have permission to receive appointment.");

    const userPreference = await prismaCommon.userPreference.findFirst({
      where: {
        User: {
          userId: session.user.sub,
        }
      }
    });

    const role = formData.get('role');
    const autoAssignToSelf = (userPreference?.autoAssignAppointmentToSelf && !!role) || false;
    const autoAcceptAppointment = userPreference?.autoAcceptAppointmentAssignment || false;
    
    const appointmentId = parseInt(formData.get('appointmentId') as string);
    const newStatus = formData.get('status') as string;
    await prismaTenant.appointmentAttribute.update({
      where: {
        appointmentId
      },
      data: {
        status: autoAssignToSelf ? "ROUTED" : newStatus,
        receivedAt: new Date(),
        receivedBy: session.user.sub,
        ...(autoAssignToSelf ? {
          Appointment: {
            update: {
              AppointmentRouting: {
                create: {
                  routedTo: session.user.sub,
                  routedBy:session.user.sub,
                  routedToRole: String(role),
                  status: autoAcceptAppointment ? "ACCEPTED" : "PENDING",
                }
              }
            }
          }
        } : {})
      }
    })
    return {
      status: true,
      message: 'Appointment received'
    };
  } catch (error) {
    console.error(`Error receiving appointment: ${error}`);
    let message = "An error occurred while receiving appointment.";
    if(error instanceof Error) message = error.message;
    return {
      status: false,
      message,
    }
  }
}

export const completeAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  
  try {
    if(!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "ORGANIZATION"});
    const completeAppointmentPermissions = [PERMISSIONS.ORGANIZATION["COMPLETE:ORG:APPOINTMENT"].name];
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const canCompleteAppointment = completeAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

    if(!canCompleteAppointment) throw new Error("You do not have permission to complete appointment.");
    
    const appointmentId = parseInt(formData.get('appointmentId') as string);
    await prismaTenant.appointmentAttribute.update({
      where: {
        appointmentId,
        status: {
          not: "COMPLETED"
        }
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedBy: session.user.sub
      }
    })
    return {
      status: true,
      message: 'Appointment completed'
    };
  } catch (error) {
    console.error(`Error completing appointment: ${error}`);
    let message = "An error occurred while completing appointment.";
    if(error instanceof Error) message = error.message;
    return {
      status: false,
      message,
    }
  }
}

export const rejectAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  
  try {
    if(!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "ORGANIZATION"});
    const rejectAppointmentPermissions = [PERMISSIONS.ORGANIZATION["REJECT:ORG:APPOINTMENT"].name];
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const canRejectAppointment = rejectAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

    if(!canRejectAppointment) throw new Error("You do not have permission to reject appointment.");

    const appointmentId = parseInt(formData.get('appointmentId') as string);
    const reason = formData.get('reason') as string;
    
    await prismaTenant.appointmentAttribute.update({
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
        rejectedBy: session.user.sub
      }
    })
    return {
      status: true,
      message: 'Appointment rejected'
    };
  } catch (error) {
    console.error(`Error rejecting appointment: ${error}`);
    let message = "An error occurred while rejecting appointment.";
    if(error instanceof Error) message = error.message;
    return {
      status: false,
      message,
    }
  }
}