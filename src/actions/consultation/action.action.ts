"use server";

import "server-only";
import prisma from "@lib/prisma";
import { hasCodeProperty } from "@lib/utils";
import { getCachedSession } from "@actions/session.action";

export type GetActions = Awaited<ReturnType<typeof getActionsAction>>;
export const getActionsAction = async () => {
  let message = "Actions fetched successfully.";
  try {

    const session = await getCachedSession()
    if(!session) throw new Error("User not authenticated.")

    const actions = await prisma.action.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true
      }
    });
    return { status: true, message, data: actions}
  } catch (error) {
    console.error(`Error fetching actions: ${error}`);
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === 'P2025')  message = "Actions not found";
    return { status: false,  message, data: [] }
  }
}