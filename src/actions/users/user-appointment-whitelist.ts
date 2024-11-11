"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";

export type GetUserAppointmentWhitelist = Awaited<ReturnType<typeof getUserAppointmentWhitelistAction>>;
export const getUserAppointmentWhitelistAction = async (orgUid: string, userId?: string, ) => {
  try {
    
    const whitelist = await prismaCommon.userOrgAppointmentWhitelist.findMany({
      where: {
        User: {
          userId
        },
        Organization: {
          orgId: orgUid
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
    orgId: string;
    name: string;
}
export const createWhitelistAction = async (payload: CreateWhitelistPayload) => {
  try {
    const whitelist = await prismaCommon.userOrgAppointmentWhitelist.create({
      data: {
        name: payload.name,
        User: {
          connect: {
            userId: payload.userId
          }
        },
        Organization: {
          connect: {
            orgId: payload.orgId
          }
        }
      }
    });
    return { status: true, message: "Whitelist filter created successfully.", data: whitelist }
  } catch (error) {
    console.error(`Error creating whitelist filter: ${error}`);
    let message = "An error occurred while creating whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message, data: null }
  };
}

type UpdateWhitelistPayload = {
    id: number
    name: string
}
export const updateWhitelistAction = async (payload: UpdateWhitelistPayload) => {
  try {
    const whitelist = await prismaCommon.userOrgAppointmentWhitelist.update({
      where: { id: payload.id },
      data: { name: payload.name }
    });
    return { status: true, message: "Whitelist filter updated successfully.", data: whitelist }
  } catch (error) {
    console.error(`Error updating whitelist filter: ${error}`);
    let message = "An error occurred while updating whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message, data: null }
  };
}

export const deleteWhitelistAction = async (id: number) => {
  try {
    await prismaCommon.userOrgAppointmentWhitelist.delete({
      where: { id }
    });
    return { status: true, message: "Whitelist filter deleted successfully." }
  } catch (error) {
    console.error(`Error deleting whitelist filter: ${error}`);
    let message = "An error occurred while deleting whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message }
  };
}