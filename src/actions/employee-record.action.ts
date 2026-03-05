"use server";

import prisma from "@lib/prisma";
import { hasCodeProperty } from "@lib/utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";

export type CreateUserEmploymentRecord = {
  employeeId: string;
  position: string
  designation?: string
  userId: string
  orgUid: string
  officeId?: number
  departmentId?: number
  collegeId?: number
}

export const createEmploymentRecordAction = withErrorHandling(async (payload: CreateUserEmploymentRecord) => {

  await sessionCheck()

  const { employeeId, position, designation, userId, orgUid, departmentId, collegeId } = payload

  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  const employeeRecord = await prisma.userEmploymentRecord.create({
    data: {
      employeeId,
      position,
      designation,
      User: {
        connect: { id: currentUser.id }
      },
      Organization: {
        connect: {
          orgUid
        }
      },
      Department: {
        connect: { id: departmentId }
      },
      College: {
        connect: { id: collegeId }
      }
    }
  });
  return { message: "Employee record created successfully", data: employeeRecord };
})

export const upsertEmploymentRecordAction = withErrorHandling(async (payload: CreateUserEmploymentRecord) => {

  await sessionCheck()

  const { employeeId, position, designation, userId, orgUid, officeId, departmentId, collegeId } = payload

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { orgUid, isActive: true },
    select: { id: true }
  })

  const user = await prisma.user.findUniqueOrThrow({ where: { userId }, select: { id: true } })
  const employeeRecord = await prisma.userEmploymentRecord.upsert({
    where: {
      unique_user_employment: {
        userId: user.id,
        organizationId: organization.id
      }
    },
    create: {
      employeeId,
      userId: user.id,
      position,
      designation,
      organizationId: organization.id,
      officeId,
      departmentId,
      collegeId,
    },
    update: {
      employeeId,
      userId: user.id,
      position,
      designation,
      organizationId: organization.id,
      officeId,
      departmentId,
      collegeId,
    }
  });
  return { success: true, message: "Employee record created/updated successfully", data: employeeRecord };
}, async (error) => {
  if (hasCodeProperty(error) && error.code === "P2002") return "The provided Employee ID is already taken. Please use a different Employee ID. If you think this is an internal error, please contact the administrator.";
});

export type GetOrgUserEmploymentRecord = Awaited<ReturnType<typeof getOrgUserEmploymentRecordAction>>
export const getOrgUserEmploymentRecordAction = withErrorHandling(async ({ userId, orgUid }: { userId: string, orgUid: string }) => {

  await sessionCheck()

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { orgUid, isActive: true },
    select: { id: true }
  })

  const user = await prisma.user.findUniqueOrThrow({ where: { userId }, select: { id: true } })
  const employmentRecord = await prisma.userEmploymentRecord.findUnique({
    where: {
      unique_user_employment: {
        userId: user.id,
        organizationId: organization.id
      }
    }
  });
  return { message: "Employee record fetched successfully", data: employmentRecord };
})