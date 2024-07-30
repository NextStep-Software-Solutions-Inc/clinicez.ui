"use server";

import prisma from "@lib/prisma-common";
import { Prisma } from "@prisma/common/client";
import { PrismaClientKnownRequestError } from "@prisma/common/client/runtime/library";


export type CreateUserEmploymentRecord = {
  employeeId: string;
  position: string
  designation?: string
  userId: number
  orgId: number
  officeId?: number
  departmentId?: number
  collegeId?: number
}

export const createEmploymentRecordAction = async (payload:CreateUserEmploymentRecord ) => {
  const { employeeId, position, designation, userId, orgId, departmentId, collegeId } = payload
  const User: Prisma.UserEmploymentRecordCreateInput["User"] = {
    connect: {
      id: userId
    }
  }
  const Organization: Prisma.UserEmploymentRecordCreateInput["Organization"] = {
    connect: {
      id: orgId
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
  const employeeRecord = await prisma.userEmploymentRecord.create({
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
  return employeeRecord;
}

export const upsertEmploymentRecordAction = async (payload:CreateUserEmploymentRecord ) => {
  const { employeeId, position, designation, userId, orgId, officeId, departmentId, collegeId } = payload
  const response = {
    success: false,
    message: "Something went wrong!",
    data: null
  }
  try {
    const employeeRecord = await prisma.userEmploymentRecord.upsert({
      where: {
        unique_user_employment: {
          userId,
          organizationId: orgId
        }
      },
      create: {
        employeeId,
        userId,
        position,
        designation,
        organizationId: orgId,
        officeId,
        departmentId,
        collegeId,
      },
      update: {
        employeeId,
        userId,
        position,
        designation,
        organizationId: orgId,
        officeId,
        departmentId,
        collegeId,
      }
    });
    response.success = true;
    response.message = "Employee record successfully created";
    return  {...response, data: employeeRecord};
  } catch (error) {
    if(error instanceof PrismaClientKnownRequestError) {
      console.log({error});
      
      if(error.code === "P2002") {
        return {
          ...response,
          message: "The provided Employee ID is already taken. Please use a different Employee ID. If you think this is an internal error, please contact the administrator."
        }
      }
    }
    return response;
  }
}