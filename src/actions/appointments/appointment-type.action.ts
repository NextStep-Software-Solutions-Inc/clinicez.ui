"use server";

import prisma from "@lib/prisma";
import { cache } from "react";

export type GetAppointmentTypes = Awaited<ReturnType<typeof getAppointmentTypesAction>>;
export const getAppointmentTypesAction = cache(async (clinicUid: string) => {
  return await prisma.appointmentType.findMany({
    orderBy: {
      name: 'asc'
    },
    where: {
      Clinic: {
        clinicUid
      },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      description: true,
      AppointmentTypeAttribute: {
        select: {
          id: true,
          duration: true,
          durationPadding: true,
          reminders: true,
          requirements: true,
        }
      }
    }
  });
})

type UpdateAppointmentTypePayload = {
  id: number;
  name: string;
  description?: string;
  duration?: number;
  durationPadding?: number;
}
export const updateAppointmentTypeAction = async (payload: UpdateAppointmentTypePayload) => {
  const { id, name, description, duration, durationPadding } = payload;
  try {
    await prisma.appointmentType.update({
      where: { id, isActive: true },
      data: {
        name,
        description,
        AppointmentTypeAttribute: {
          update: {
            duration: duration,
            durationPadding: durationPadding,
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        AppointmentTypeAttribute: {
          select: {
            id: true,
            duration: true,
            durationPadding: true,
            reminders: true,
            requirements: true,
          }
        }
      }
    })
    return { status: true, message: 'Appointment type updated successfully' };
  } catch (error) {
    console.error(`Error updating appointment type: ${error}`);
    let message = 'Failed to update appointment type';
    if(error instanceof Error) message = error.message;
    return { status: false, message };
  }
}

export const deleteAppointmentTypeAction = async (id: number) => {
  try {
    await prisma.appointmentType.update({
      where: { id, isActive: true },
      data: {
        isActive: false
      }
    })
    return { status: true, message: 'Appointment type deleted successfully' };
  } catch (error) {
    console.error(`Error deleting appointment type: ${error}`);
    let message = 'Failed to delete appointment type';
    if(error instanceof Error) message = error.message;
    return { status: false, message };
  }
}

type CreateAppointmentTypePayload = {
  clinicUid: string;
  name: string;
  description?: string;
  duration?: number;
  durationPadding?: number;
}
export const createAppointmentTypeAction = async (payload: CreateAppointmentTypePayload) => {
  const { clinicUid, name, description, duration = 10, durationPadding = 5 } = payload;
  try {
    await prisma.appointmentType.create({
      data: {
        name,
        description,
        Clinic: {
          connect: {
            clinicUid
          }
        },
        AppointmentTypeAttribute: {
          create: {
            duration,
            durationPadding,
            reminders: [],
            requirements: [],
            resources: [],
            specializations: []
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        AppointmentTypeAttribute: {
          select: {
            id: true,
            duration: true,
            durationPadding: true,
            reminders: true,
            requirements: true,
          }
        }
      }
    })
    return { status: true, message: 'Appointment type created successfully' };
  } catch (error) {
    console.error(`Error creating appointment type: ${error}`);
    let message = 'Failed to create appointment type';
    if(error instanceof Error) message = error.message;
    return { status: false, message };
  }
}