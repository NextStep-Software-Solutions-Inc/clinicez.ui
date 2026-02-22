"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export type GetOrgDepartments = Awaited<ReturnType<typeof getOrgDepartmentAction>>
export const getOrgDepartmentAction = async (orgUid: string) => {
  const orgDepartment = await prisma.organizationDepartment.findMany({
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
  return orgDepartment;
}

export const createOrgDepartmentAction = async (orgUid: string, payload: { name: string }) => {
  let message = "Department created successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const { name } = payload;
    const item = await prisma.organizationDepartment.create({
      data: {
        name,
        Organization: { connect: { orgUid } },
      },
      select: { id: true, name: true },
    });
    return { status: true, message, data: item };
  } catch (error) {
    console.error(`Failed to create department: ${error}`);
    message = "Failed to create department";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
};

export const updateOrgDepartmentAction = async (id: number, payload: { name: string }) => {
  let message = "Department updated successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationDepartment.update({
      where: { id },
      data: { name: payload.name },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to update department: ${error}`);
    message = "Failed to update department";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};

export const deleteOrgDepartmentAction = async (id: number) => {
  let message = "Department deleted successfully";
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    await prisma.organizationDepartment.update({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return { status: true, message };
  } catch (error) {
    console.error(`Failed to delete department: ${error}`);
    message = "Failed to delete department";
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
};