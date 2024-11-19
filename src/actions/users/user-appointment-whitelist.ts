"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "../session.action";

export type GetUserAppointmentWhitelist = Awaited<ReturnType<typeof getUserAppointmentWhitelistAction>>;
export const getUserAppointmentWhitelistAction = async (clinicUid: string, userId?: string, ) => {
  try {
    
    const whitelist = await prisma.userClinicAppointmentWhitelist.findMany({
      where: {
        User: {
          userId
        },
        Clinic: {
          clinicUid
        }
      },
      include: {
        WhitelistFilters: {
          select: {
            id: true,
            value: true,
            Filter: {
              select: {
                id: true,
                name: true,
                key: true
              }
            }
          }
        }
      }
    });
    
    return { status: true, message: "User appointment whitelist fetched successfully.", data: whitelist }
  } catch (error) {
    console.error(`Error fetching user appointment whitelist: ${error}`);
    let message = "An error occurred while fetching user appointment whitelist.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message, data: null }
  };
}

type CreateWhitelistPayload = {
    userId: string;
    clinicUid: string;
    name: string;
}
export const createWhitelistAction = async (payload: CreateWhitelistPayload) => {
  let message = "Whitelist filter created successfully.";
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    const { clinicUid, name, userId } = payload;
    const whitelist = await prisma.userClinicAppointmentWhitelist.create({
      data: {
        name,
        User: {
          connect: {
            userId
          }
        },
        Clinic: {
          connect: {
            clinicUid
          }
        }
      }
    });
    return { status: true, message, data: whitelist }
  } catch (error) {
    console.error(`Error creating whitelist filter: ${error}`);
    message = "An error occurred while creating whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  };
}

type UpdateWhitelistPayload = {
    id: number
    name: string
}
export const updateWhitelistAction = async (payload: UpdateWhitelistPayload) => {

  let message = "Whitelist filter updated successfully.";

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    const whitelist = await prisma.userClinicAppointmentWhitelist.update({
      where: { id: payload.id },
      data: { name: payload.name }
    });

    return { status: true, message, data: whitelist }
  } catch (error) {
    console.error(`Error updating whitelist filter: ${error}`);
    message = "An error occurred while updating whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  };
}

export const deleteWhitelistAction = async (id: number) => {

  let message = "Whitelist filter deleted successfully.";

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    await prisma.userClinicAppointmentWhitelist.delete({
      where: { id }
    });
    return { status: true, message }
  } catch (error) {
    console.error(`Error deleting whitelist filter: ${error}`);
    message = "An error occurred while deleting whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message }
  };
}