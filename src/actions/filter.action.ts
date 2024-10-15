"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";

export type GetFilters = Awaited<ReturnType<typeof getFilters>>;
export const getFilters = async () => {
  try {
    const filters = await prismaCommon.filter.findMany({
      orderBy: {
        key: "asc"
      }
    });
    return { status: true, message: "Filters fetched successfully.", data: filters }
  } catch (error) {
    console.error(`Error fetching filters: ${error}`);
    let message = "An error occurred while fetching filters.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message, data: [] }
  };
}
 
type AddWhitelistFilterPayload = {
  whitelistId: number, filterId: number, value: string
}
export const addWhitelistFilterAction = async ({whitelistId, filterId, value}:AddWhitelistFilterPayload) => {
  try {
    const whitelistFilter = await prismaCommon.whitelistFilter.create({
      data: {
        value,
        UserOrgAppointmentWhitelist: {
          connect: {
            id: whitelistId
          }
        },
        Filter: {
          connect: {
            id: filterId
          }
        }
      }
    });
    return { status: true, message: "Whitelist filter added successfully.", data: whitelistFilter }
  } catch (error) {
    console.error(`Error adding whitelist filter: ${error}`);
    let message = "An error occurred while adding whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message, data: null }
  };
}

type UpdateWhitelistFilterPayload = {
    id: number, value: string, filterId: number
}
export const updateWhitelistFilterAction = async (payload: UpdateWhitelistFilterPayload) => {
  try {
    const whitelistFilter = await prismaCommon.whitelistFilter.update({
      where: { id: payload.id },
      data: { value: payload.value, filterId: payload.filterId }
    });
    return { status: true, message: "Whitelist filter updated successfully.", data: whitelistFilter }
  } catch (error) {
    console.error(`Error updating whitelist filter: ${error}`);
    let message = "An error occurred while updating whitelist filter.";
    if (error instanceof Error) message = error.message;
    return { status: false,  message, data: null }
  };
}

export const deleteWhitelistFilterAction = async (id: number) => {
  try {
    await prismaCommon.whitelistFilter.delete({
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