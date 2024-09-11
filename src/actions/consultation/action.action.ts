"use server";

import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';

export type GetActions = Awaited<ReturnType<typeof getActionsAction>>;
export const getActionsAction = async () => {
  try {
    const actions = await prismaTenant.action.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true
      }
    });
    return {
      status: true,
      message: "Actions fetched successfully",
      data: actions
    }
  } catch (error) {
    console.error(error);
    let message = "Failed to fetch actions";
    if(error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      message = "Actions not found";
    }
    return {
      status: false,
      message,
      data: []
    }
  }
}