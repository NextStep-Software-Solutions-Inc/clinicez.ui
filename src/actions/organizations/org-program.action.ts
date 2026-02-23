"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetOrgPrograms = Awaited<ReturnType<typeof getOrgProgramsAction>>
export const getOrgProgramsAction = async (orgUid: string) => {
  const orgProgram = await prisma.organizationProgram.findMany({
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
      major: true,
      description: true,
      organizationId: true,
    }
  });
  return orgProgram;
}

export const createOrgProgramAction = async (orgUid: string, payload: { name: string }) => {
  let message = "Program created successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const { name } = payload;
    const item = await prisma.organizationProgram.create({
      data: {
        name,
        Organization: { connect: { orgUid } },
      },
      select: { id: true, name: true },
    });
    return { status: true, message, data: item };
  } catch (error) {
    console.error(`Failed to create program: ${error}`);
    message = "Failed to create program";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const updateOrgProgramAction = async (id: number, payload: { name: string }) => {
  let message = "Program updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationProgram.update({
      where: { id },
      data: { name: payload.name },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to update program: ${error}`);
    message = "Failed to update program";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};

export const deleteOrgProgramAction = async (id: number) => {
  let message = "Program deleted successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationProgram.update({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to delete program: ${error}`);
    message = "Failed to delete program";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};