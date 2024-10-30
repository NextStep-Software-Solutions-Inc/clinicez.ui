"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";
import { getCachedSession } from "./session.action";

export type GetHPTypes = Awaited<ReturnType<typeof getHPTypesAction>>;
export const getHPTypesAction = async () => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("User not authenticated.");

    const hpTypes = await prismaCommon.healthcareProviderType.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    });

    return { status: true, message: "User preference fetched successfully.", data: hpTypes }
  } catch (error) {
    console.error(`Error fetching user preference: ${error}`);
    let message = "An error occurred while fetching user preference.";
    if (error instanceof Error)  message = error.message;
    return { status: false, message, data: []}
  }
};