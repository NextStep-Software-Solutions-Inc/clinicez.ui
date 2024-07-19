"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";


export type CreateUserStudentRecord = {
  studentId: string;
  levelId: number
  userId: string
  orgId: string
  lrn?: string;
  departmentId?: number
  programId?: number
  collegeId?: number
  yearLevelId?: number
}


export const createStudentRecordAction = async (payload:CreateUserStudentRecord ) => {
  const { userId, orgId, studentId, lrn, departmentId, programId, collegeId, levelId, yearLevelId } = payload
  const User: Prisma.UserStudentRecordCreateInput["User"] = {
    connect: {
      userId
    }
  }
  const Organization: Prisma.UserStudentRecordCreateInput["Organization"] = {
    connect: {
      orgId
    }
  }
  const Level: Prisma.UserStudentRecordCreateInput["Level"] =  {
    connect: {
      id: levelId
    }
  }

  const Department: Prisma.UserStudentRecordCreateInput["Department"] =  {
    connect: {
      id: departmentId
    }
  }

  const Program: Prisma.UserStudentRecordCreateInput["Program"] =  {
    connect: {
      id: programId
    }
  }

  const College: Prisma.UserStudentRecordCreateInput["College"] =  {
    connect: {
      id: collegeId
    }
  }

  const YearLevel: Prisma.UserStudentRecordCreateInput["YearLevel"] =  {
    connect: {
      id: yearLevelId
    }
  }

  const studentRecord = await prisma.userStudentRecord.create({
    data: {
      studentId,
      User,
      Organization,
      Level,
      lrn,
      ...departmentId ? Department : {},
      ...programId ? Program : {}, 
      ...collegeId ? College : {},
      ...yearLevelId ? YearLevel :{}
    }
  });
  return studentRecord;
}