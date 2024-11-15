"use server";
import 'server-only'

import { getCachedSession } from '@actions/session.action';
import prisma from '@lib/prisma';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';

export const receiveAppointmentAction = async (formData: FormData) => {
  const session = await getCachedSession();
  
  try {
    if(!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "CLINIC"});
    const receiveAppointmentPermissions = [PERMISSIONS.CLINIC["RECEIVE:CLINIC:APPOINTMENT"].name];
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const canReceiveAppointment = receiveAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

    if(!canReceiveAppointment) throw new Error("You do not have permission to receive appointment.");

    const userPreference = await prisma.userPreference.findFirst({
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
    await prisma.appointmentAttribute.update({
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

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "CLINIC"});
    const completeAppointmentPermissions = [PERMISSIONS.CLINIC["COMPLETE:CLINIC:APPOINTMENT"].name];
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const canCompleteAppointment = completeAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

    if(!canCompleteAppointment) throw new Error("You do not have permission to complete appointment.");
    
    const appointmentId = parseInt(formData.get('appointmentId') as string);
    await prisma.appointmentAttribute.update({
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

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "CLINIC"});
    const rejectAppointmentPermissions = [PERMISSIONS.CLINIC["REJECT:CLINIC:APPOINTMENT"].name];
    const myPermissionArray = myPermissions.map(permission => permission.name);
    const canRejectAppointment = rejectAppointmentPermissions.some(permission => myPermissionArray.includes(permission));

    if(!canRejectAppointment) throw new Error("You do not have permission to reject appointment.");

    const appointmentId = parseInt(formData.get('appointmentId') as string);
    const reason = formData.get('reason') as string;
    
    await prisma.appointmentAttribute.update({
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