"use server";

import prisma from "@lib/prisma";
import { hasCodeProperty } from "@lib/utils";
import { getCachedSession } from "@actions/session.action";

export type CreateUserEmploymentRecord = {
  employeeId: string;
  position: string
  designation?: string
  userId: number
  orgUid: string
  officeId?: number
  departmentId?: number
  collegeId?: number
}

export const createEmploymentRecordAction = async (payload:CreateUserEmploymentRecord ) => {
  const { employeeId, position, designation, userId, orgUid, departmentId, collegeId } = payload

  const organization = await prisma.organization.findUniqueOrThrow({ 
    where: {orgUid, isActive: true},
    select: {id: true} 
  })
  const employeeRecord = await prisma.userEmploymentRecord.create({
    data: {
      employeeId,
      userId,
      position,
      designation,
      organizationId: organization.id,
      departmentId,
      collegeId,
    }
  });
  return employeeRecord;
}

export const upsertEmploymentRecordAction = async (payload:CreateUserEmploymentRecord ) => {
  
  try {

    const session = await getCachedSession()
    if(!session) throw new Error("User not authenticated.")


    const { employeeId, position, designation, userId, orgUid, officeId, departmentId, collegeId } = payload
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { orgUid, isActive: true },
      select: { id: true }
    })
    const employeeRecord = await prisma.userEmploymentRecord.upsert({
      where: {
        unique_user_employment: {
          userId,
          organizationId: organization.id
        }
      },
      create: {
        employeeId,
        userId,
        position,
        designation,
        organizationId: organization.id,
        officeId,
        departmentId,
        collegeId,
      },
      update: {
        employeeId,
        userId,
        position,
        designation,
        organizationId: organization.id,
        officeId,
        departmentId,
        collegeId,
      }
    });
    return  { success: true, message: "Employee record created/updated successfully",  data: employeeRecord};
  } catch (error) {
    console.error(`Error creating/updating employee record: ${error}`);
    let message = "Something went wrong!";
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === "P2002") message = "The provided Employee ID is already taken. Please use a different Employee ID. If you think this is an internal error, please contact the administrator.";
    return { success: false, message, data: null };
  }
}

export const getEmploymentRecordAction = async (userId: number, orgId: number) => {
  const employmentRecord = await prisma.userEmploymentRecord.findFirst({
    where: {
      userId,
      organizationId: orgId
    }
  });
  return employmentRecord;
}