"use server";

import prisma from "@lib/prisma-tenant";
import { cache } from "react";

export type GetAppointmentModes = Awaited<ReturnType<typeof getAppointmentModesAction>>;
export const getAppointmentModesAction = cache(async (orgUid: string) => {
  return await prisma.appointmentMode.findMany({
    orderBy: {
      name: 'asc'
    },
    where: {
      orgUid,
      isActive: true
    }
  });
})

type CreateAppointmentModePayload = {
  name: string;
  description?: string;
  orgUid: string;
}
export const createAppointmentModeAction = async (payload: CreateAppointmentModePayload) => {
  const { name, description, orgUid } = payload;
  try {
    const appointmentMode = await prisma.appointmentMode.create({
      data: {
        name,
        description,
        orgUid
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