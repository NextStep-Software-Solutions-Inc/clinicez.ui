"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetOrgOffices = Awaited<ReturnType<typeof getOrgOfficesAction>>
export const getOrgOfficesAction = async (orgUid: string) => {
  const orgOffice = await prisma.organizationOffice.findMany({
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
      description: true,
      organizationId: true,
    }
  });
  return orgOffice;
}

export const createOrgOfficeAction = async (orgUid: string, payload: { name: string }) => {
  let message = "Office created successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const { name } = payload;
    const item = await prisma.organizationOffice.create({
      data: {
        name,
        Organization: { connect: { orgUid } },
      },
      select: { id: true, name: true },
    });
    return { status: true, message, data: item };
  } catch (error) {
    console.error(`Failed to create office: ${error}`);
    message = "Failed to create office";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const updateOrgOfficeAction = async (id: number, payload: { name: string }) => {
  let message = "Office updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationOffice.update({
      where: { id },
      data: { name: payload.name },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to update office: ${error}`);
    message = "Failed to update office";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};

export const deleteOrgOfficeAction = async (id: number) => {
  let message = "Office deleted successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationOffice.update({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to delete office: ${error}`);
    message = "Failed to delete office";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};