"use server";

import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";

export type GetClinicServiceCategories = Awaited<ReturnType<typeof getClinicServiceCategoriesAction>>
export const getClinicServiceCategoriesAction = async (clinicUid?: string) => {
  const clinicServiceCategories = await prisma.serviceCategory.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      Clinic: {
        clinicUid
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      Services: {
        select: {
          id: true,
          name: true,
          ServiceAttribute: {
            select: {
              duration: true,
              durationPadding: true,
              reminders: true,
              requirements: true,
            }
          }
        }
      },
    }
  });
  return clinicServiceCategories;
}

type CreateClinicServiceCategoryPayload = {
  clinicUid: string;
  name: string;
  description?: string;
}
export const createClinicServiceCategoryAction = async (payload: CreateClinicServiceCategoryPayload) => {
  let message = "Service category created successfully";
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");


    const { name, description, clinicUid } = payload;
    await prisma.serviceCategory.create({
      data: {
        name,
        description,
        Clinic: {
          connect: { clinicUid }
        }
      }
    });
    return { status: true, message}
  } catch (error) {
    console.error(`Failed to create service category: ${error}`);
    message = "Failed to create service category";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

type UpdateClinicServiceCategoryPayload = {
  id: number;
  name: string;
  description?: string;
}
export const updateClinicServiceCategoryAction = async (payload: UpdateClinicServiceCategoryPayload) => {
  let message = "Service category updated successfully";
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    const { id, name, description } = payload;
    await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description
      }
    });
    return { status: true, message}
  } catch (error) {
    console.error(`Failed to update service category: ${error}`);
    message = "Failed to update service category";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}

export const deleteServiceCategoryAction = async (id: number) => {

  let message = "Service category deleted successfully";

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    await prisma.serviceCategory.update({
      where: { id, isActive: true },
      data: {  isActive: false
      }
    });
    return { status: true, message}
  } catch (error) {
    console.error(`Failed to delete service category: ${error}`);
    message = "Failed to delete service category";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}