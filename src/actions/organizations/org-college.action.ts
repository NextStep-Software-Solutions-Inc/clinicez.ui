"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetOrgColleges = Awaited<ReturnType<typeof getOrgCollegesAction>>
export const getOrgCollegesAction = async (orgUid: string) => {
  const orgCollege = await prisma.organizationCollege.findMany({
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
  return orgCollege;
}

export const createOrgCollegeAction = async (orgUid: string, payload: { name: string }) => {
  let message = "College created successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const { name } = payload;
    const item = await prisma.organizationCollege.create({
      data: {
        name,
        Organization: { connect: { orgUid } },
      },
      select: { id: true, name: true },
    });
    return { status: true, message, data: item };
  } catch (error) {
    console.error(`Failed to create college: ${error}`);
    message = "Failed to create college";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const updateOrgCollegeAction = async (id: number, payload: { name: string }) => {
  let message = "College updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationCollege.update({
      where: { id },
      data: { name: payload.name },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to update college: ${error}`);
    message = "Failed to update college";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};

export const deleteOrgCollegeAction = async (id: number) => {
  let message = "College deleted successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationCollege.update({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to delete college: ${error}`);
    message = "Failed to delete college";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};