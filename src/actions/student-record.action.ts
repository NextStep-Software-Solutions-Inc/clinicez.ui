"use server";

import prisma from "@lib/prisma-common";
import { PrismaClientKnownRequestError } from "@prisma/common/client/runtime/library";

export type CreateUserStudentRecord = {
  studentId: string;
  levelId: number
  userId: number
  orgId: number
  lrn?: string;
  departmentId?: number
  programId?: number
  collegeId?: number
  yearLevelId?: number
}

export const createStudentRecordAction = async (payload:CreateUserStudentRecord ) => {
  const { userId, orgId, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload

  const studentRecord = await prisma.userStudentRecord.create({
    data: {
      studentId,
      userId,
      organizationId: orgId,
      level: levelId,
      lrn,
      departmentId,
      programId, 
      collegeId,
      yearLevel: yearLevelId
    }
  });
  return studentRecord;
}


export const upsertStudentRecordAction = async (payload:CreateUserStudentRecord ) => {
  const { userId, orgId, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload
  const response = {
    success: false,
    message: "Something went wrong!",
    data: null
  }
  try {
    const studentRecord = await prisma.userStudentRecord.upsert({
      where: {
        unique_user_student_record: {
          userId,
          organizationId: orgId
        }
      },
      create: {
        studentId,
        userId,
        organizationId: orgId,
        level: levelId,
        lrn,
        departmentId,
        programId, 
        collegeId,
        yearLevel: yearLevelId
      },
      update: {
        studentId,
        userId,
        organizationId: orgId,
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
      console.log({error});
    
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