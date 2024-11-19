"use server";

import prisma from "@lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export type CreateUserStudentRecord = {
  studentId: string;
  levelId: number
  userId: number
  orgUid: string
  lrn?: string;
  departmentId?: number
  programId?: number
  collegeId?: number
  yearLevelId?: number
}

export const createStudentRecordAction = async (payload:CreateUserStudentRecord ) => {
  const { userId, orgUid, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { orgUid, isActive: true },
    select: { id: true }
  })
  const studentRecord = await prisma.userStudentRecord.create({
    data: {
      studentId,
      lrn,
      level: levelId,
      userId,
      organizationId: organization.id,
      departmentId,
      programId,
      collegeId,
      yearLevel: yearLevelId,
    }
  });
  return studentRecord;
}


export const upsertStudentRecordAction = async (payload:CreateUserStudentRecord ) => {
  const { userId, orgUid, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload
  const response = {
    success: false,
    message: "Something went wrong!",
    data: null
  }
  try {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { orgUid, isActive: true },
      select: { id: true }
    })
    const studentRecord = await prisma.userStudentRecord.upsert({
      where: {
        unique_user_student_record: {
          userId,
          organizationId: organization.id
        }
      },
      create: {
        studentId,
        userId,
        organizationId: organization.id,
        level: levelId,
        lrn,
        departmentId,
        programId, 
        collegeId,
        yearLevel: yearLevelId
      },
      update: {
        studentId,
        level: levelId,
        lrn,
        departmentId,
        programId, 
        collegeId,
        yearLevel: yearLevelId
      }
    });
    response.success = true;
    response.message = "Student record successfully created";
    return  {...response, data: studentRecord};
  } catch (error) {
    if(error instanceof PrismaClientKnownRequestError) {
      if(error.code === "P2002") {
        return {
          ...response,
          message: "The provided Student ID or LRN is already taken. Please use a different Student ID or LRN. If you think this is an internal error, please contact the administrator."
        }
      }
    }
    return response;
  }
}