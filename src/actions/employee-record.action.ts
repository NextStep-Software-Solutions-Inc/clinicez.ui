"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";


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
  return employeeRecord;
}