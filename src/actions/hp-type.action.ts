"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "./session.action";

export type GetHPTypes = Awaited<ReturnType<typeof getHPTypesAction>>;
export const getHPTypesAction = async () => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("User not authenticated.");

    const hpTypes = await prisma.healthcareProviderType.findMany({
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