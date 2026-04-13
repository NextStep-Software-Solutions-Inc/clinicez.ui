"use server";

import { sessionCheck } from "@/lib/auth";
import { hasCodeProperty } from "@/lib/utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import prisma from "@lib/prisma";

export type CreateUserStudentRecord = {
  studentId: string;
  levelId: number
  userId: string
  orgUid: string
  lrn?: string;
  departmentId?: number
  programId?: number
  collegeId?: number
  yearLevelId?: number
}

export const createStudentRecordAction = withErrorHandling(async (payload: CreateUserStudentRecord) => {

  await sessionCheck();

  const { userId, orgUid, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload

  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  const studentRecord = await prisma.userStudentRecord.create({
    data: {
      lrn: lrn?.trim() ? lrn.trim() : null,
      studentId,
      Level: { connect: { id: levelId } },
      User: { connect: { id: currentUser.id } },
      Organization: { connect: { orgUid } },
      Department: { connect: { id: departmentId } },
      Program: { connect: { id: programId } },
      College: { connect: { id: collegeId } },
      OrganizationYearLevel: { connect: { id: yearLevelId } }
    }
  });
  return { success: true, message: "Something went wrong!", data: studentRecord };
})


export const upsertStudentRecordAction = withErrorHandling(async (payload: CreateUserStudentRecord) => {

  await sessionCheck();
  const { userId, orgUid, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { orgUid, isActive: true },
    select: { id: true }
  })

  const user = await prisma.user.findUniqueOrThrow({ where: { userId }, select: { id: true } })
  const studentRecord = await prisma.userStudentRecord.upsert({
    where: {
      unique_user_student_record: {
        userId: user.id,
        organizationId: organization.id
      }
    },
    create: {
      studentId,
      userId: user.id,
      organizationId: organization.id,
      level: levelId,
      lrn: lrn?.trim() ? lrn.trim() : null,
      departmentId,
      programId,
      collegeId,
      yearLevel: yearLevelId
    },
    update: {
      studentId,
      level: levelId,
      lrn: lrn?.trim() ? lrn.trim() : null,
      departmentId,
      programId,
      collegeId,
      yearLevel: yearLevelId
    }
  });

  return { success: true, message: "Student Record updated", data: studentRecord };

}, async error => {
  if (hasCodeProperty(error)) {
    if (error.code === "P2002") {
      return "The provided Student ID or LRN is already taken. Please use a different Student ID or LRN. If you think this is an internal error, please contact the administrator."
    }
  }
})

export type GetOrgStudentRecord = Awaited<ReturnType<typeof getOrgStudentRecordAction>>
export const getOrgStudentRecordAction = withErrorHandling(async (payload: { userId: string, orgUid: string }) => {

  await sessionCheck();

  const { userId, orgUid } = payload

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { orgUid, isActive: true },
    select: { id: true }
  })
  const user = await prisma.user.findUniqueOrThrow({ where: { userId }, select: { id: true } })
  const studentRecord = await prisma.userStudentRecord.findUnique({
    where: {
      unique_user_student_record: {
        userId: user.id,
        organizationId: organization.id
      }
    }
  });

  return { success: true, message: "Something went wrong!", data: studentRecord };

})