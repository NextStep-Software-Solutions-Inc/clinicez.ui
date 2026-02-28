"use server";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export type GetAppointmentModes = Awaited<ReturnType<typeof getAppointmentModesAction>>;
export const getAppointmentModesAction = cache(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  return await prisma.appointmentMode.findMany({
    orderBy: {
      name: 'asc'
    },
    where: {
      Clinic: {
        clinicUid
      },
      isActive: true
    }
  });
})

type CreateAppointmentModePayload = {
  name: string;
  description?: string;
  clinicUid: string;
}
export const createAppointmentModeAction = async (payload: CreateAppointmentModePayload) => {
  const { name, description, clinicUid } = payload;
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canUpdateSettings = [PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name].some(p => myPermissionArray.includes(p));
    if (!canUpdateSettings) throw new Error("You do not have permission to create appointment modes.");

    const appointmentMode = await prisma.appointmentMode.create({
      data: {
        name,
        description,
        Clinic: {
          connect: {
            clinicUid
          }
        }
      }
    });
    return { status: true, message: "Appointment mode created successfully", data: appointmentMode }
  } catch (error) {
    console.error(`Failed to create appointment mode: ${error}`);
    let message = "Failed to create appointment mode";
    if(error instanceof Error) message = error.message;    
    return { status: false, message, data: null }
  }
}

type UpdateAppointmentModePayload = {
  id: number;
  name: string;
  description?: string;
}
export const updateAppointmentModeAction = async (payload: UpdateAppointmentModePayload) => {
  const { id, name, description } = payload;
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canUpdateSettings = [PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name].some(p => myPermissionArray.includes(p));
    if (!canUpdateSettings) throw new Error("You do not have permission to update appointment modes.");

    const appointmentMode = await prisma.appointmentMode.update({
      where: { id, isActive: true },
      data: {
        name,
        description
      }
    });
    return { status: true, message: "Appointment mode updated successfully", data: appointmentMode }
  } catch (error) {
    console.error(`Failed to update appointment mode: ${error}`);
    let message = "Failed to update appointment mode";
    if(error instanceof Error) message = error.message;    
    return { status: false, message, data: null }
  }
}

export const deleteAppointmentModeAction = async (id: number) => {
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canUpdateSettings = [PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name].some(p => myPermissionArray.includes(p));
    if (!canUpdateSettings) throw new Error("You do not have permission to delete appointment modes.");

    await prisma.appointmentMode.update({
      where: { id, isActive: true },
      data: { isActive: false }
    });
    return { status: true, message: "Appointment mode deleted successfully" }
  } catch (error) {
    console.error(`Failed to delete appointment mode: ${error}`);
    let message = "Failed to delete appointment mode";
    if(error instanceof Error) message = error.message;    
    return { status: false, message }
  }
}