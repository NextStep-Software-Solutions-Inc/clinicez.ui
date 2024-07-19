"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";


export type CreateUserEmploymentRecord = {
  employeeId: string;
  position: string
  designation: string
  userId: string
  orgId: string
  departmentId?: number
  collegeId?: number
}

export const createStudentRecordAction = async (payload:CreateUserEmploymentRecord ) => {
  const { employeeId, position, designation, userId, orgId, departmentId, collegeId } = payload
  const User: Prisma.UserEmploymentRecordCreateInput["User"] = {
    connect: {
      userId
    }
  }
  const Organization: Prisma.UserEmploymentRecordCreateInput["Organization"] = {
    connect: {
      orgId
    }
  }
  const Department: Prisma.UserEmploymentRecordCreateInput["Department"] =  {
    connect: {
      id: departmentId
    }
  }

  
  const College: Prisma.UserEmploymentRecordCreateInput["College"] =  {
    connect: {
      id: collegeId
    }
  }


  const studentRecord = await prisma.userEmploymentRecord.create({
    data: {
      employeeId,
      User,
      position,
      designation,
      Organization,
      ...departmentId ? Department : {},
      ...collegeId ? College : {},
    }
  });
  return studentRecord;
}