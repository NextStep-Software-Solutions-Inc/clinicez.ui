"use server";

import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";

type ClinicServiceFilter = {
  clinicUid?: string,
  categoryId?: number
}
export type GetClinicServices = Awaited<ReturnType<typeof getClinicServicesAction>>
export const getClinicServicesAction = async (filter: ClinicServiceFilter) => {
  const { clinicUid, categoryId } = filter
  const clinicServices = await prisma.service.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      ServiceCategory: {
        isActive: true,
        Clinic: {
          clinicUid
        },
        id: categoryId
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      ServiceCategory: {
        select: {
          name: true
        }
      },
      ServiceAttribute: {
        select: {
          duration: true,
          durationPadding: true
        }
      }
    }
  });
  return clinicServices;
}

type CreateClinicServicePayload = {
  name: string;
  description: string;
  duration: number;
  durationPadding: number;
  categoryId: number;  
}
export const createClinicServiceAction = async (payload: CreateClinicServicePayload) => {
  let message = "Service created successfully";
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    const { name, description, duration, durationPadding, categoryId } = payload;
    await prisma.service.create({
      data: {
        name,
        description,
        categoryId,
        ServiceAttribute: {
          create: {
            duration,
            durationPadding
          }
        }
      }
    });
    return { status: true, message }
  } catch (error) {
    console.error(`Failed to create service: ${error}`);
    message = "Failed to create service";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

type UpdateClinicServicePayload = {
  id: number;
  name: string;
  description: string;
  duration: number;
  durationPadding: number;
}
export const updateClinicServiceAction = async (payload: UpdateClinicServicePayload) => {

  let message = "Service updated successfully";

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    const { id, name, description, duration, durationPadding } = payload;
    await prisma.service.update({
      where: { id, isActive: true },
      data: {
        name,
        description,
        ServiceAttribute: {
          update: {
            duration,
            durationPadding
          }
        }
      }
    });
    return { status: true, message }
  } catch (error) {
    console.error(`Failed to update service: ${error}`);
    message = "Failed to update service";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

export const deleteClinicServiceAction = async (id: number) => {
  let message = "Service deleted successfully";
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    await prisma.service.update({
      where: { id, isActive: true },
      data: {
        isActive: false
      }
    });
    return { status: true, message }
  } catch (error) {
    console.error(`Failed to delete service: ${error}`);
    message = "Failed to delete service";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}