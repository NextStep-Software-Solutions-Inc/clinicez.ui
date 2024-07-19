"use server";

import prisma from "@lib/prisma";

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
  return studentRecord;
}