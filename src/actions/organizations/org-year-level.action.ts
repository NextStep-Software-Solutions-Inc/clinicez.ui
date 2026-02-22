"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetOrganizationYearLevels = Awaited<ReturnType<typeof getOrganizationYearLevelsAction>>
export const getOrganizationYearLevelsAction = async (orgUid: string) => {
  const yearLevels = await prisma.organizationYearLevel.findMany({
    orderBy: { name: "asc" },
    where: {
      isActive: true,
      Organization: {
        orgUid
      }
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    }
  });
  return yearLevels;
}

export const createOrgYearLevelAction = async (orgUid: string, payload: { name: string }) => {
  let message = "Year level created successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const item = await prisma.organizationYearLevel.create({
      data: {
        name: payload.name,
        Organization: { connect: { orgUid } },
      },
      select: { id: true, name: true },
    });
    return { status: true, message, data: item };
  } catch (error) {
    console.error(`Failed to create year level: ${error}`);
    message = "Failed to create year level";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const updateOrgYearLevelAction = async (id: number, payload: { name: string }) => {
  let message = "Year level updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationYearLevel.update({
      where: { id },
      data: { name: payload.name },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to update year level: ${error}`);
    message = "Failed to update year level";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};

export const deleteOrgYearLevelAction = async (id: number) => {
  let message = "Year level deleted successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationYearLevel.update({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to delete year level: ${error}`);
    message = "Failed to delete year level";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};