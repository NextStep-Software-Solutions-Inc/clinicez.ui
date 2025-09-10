"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetHPTypes = Awaited<ReturnType<typeof getHPTypesAction>>;

export const getHPTypesAction = async () => {
  try {
    const hpTypes = await prisma.healthcareProviderType.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log("Fetched HP Types:", hpTypes);

    return {
      status: true,
      message: "HP Types fetched successfully.",
      data: hpTypes
    };
  } catch (error) {
    console.error(`Error fetching HP Types: ${error}`);
    let message = "An error occurred while fetching HP Types.";
    if (error instanceof Error) message = error.message;
    return {
      status: false,
      message,
      data: []
    };
  }
};