"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetDrugsFilters = {
    brandName?: string,
    genericName?: string,
}
export type GetDrugs = Awaited<ReturnType<typeof getDrugsAction>>;
export const getDrugsAction = async (filters?: GetDrugsFilters) => {
  let message = "Successfully fetched drugs";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const { brandName, genericName } = filters || {};
    const drugs = await prisma.drug.findMany({
      orderBy: {
        genericName: 'asc'
      },
      where: {
        brandName: {
          contains: brandName
        },
        genericName: {
          contains: genericName
        }
      }
    })
    return { status: true, message, data: drugs }
  } catch (error) {
    console.error(`Error while fetching drugs: ${error}`);
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: [] };
  }
}