"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import fs from 'fs/promises';
import { sendMail } from './email.action';
import path from 'path';
import { CreateUserStudentRecord } from './student-record.action';
import { CreateUserEmploymentRecord } from './employee-record.action';

export type JoinOrganizationPayload = {
  userId: string;
  orgId: string;
  orgRoleId: number;
} & Partial<CreateUserStudentRecord> & Partial<CreateUserEmploymentRecord>

export async function joinOrganizationAction(payload: JoinOrganizationPayload) {
  
  const { userId, orgId, studentId, employeeId, designation, position, lrn, orgRoleId, departmentId, programId, collegeId, levelId, yearLevelId} = payload
  
  const response = {
    status: false,
    message: "",
  }

  const request = await prisma.$transaction(async (prisma) => {
    const userOrganization = await prisma.userOrganization.create({
      data: {
        UserRole: {
          connect: { id: orgRoleId  }
        },
        User: {
          connect: { userId }
        },
        Organization: {
          connect: { orgId }
        }
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        UserRole: {
          select: {
            requirements: true
          }
        },
        Organization: {
          select: {
            name: true,
            Users: {
              select: {
                User: {
                  select: {
                    email: true
                  }
                },
                status: true,
                UserRole: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      }
    });

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
    
    for (const requirement of userOrganization.UserRole.requirements) {
      if(requirement === "student_record") {
        if(!(studentId && levelId)) {
          return {...response, message:"Student ID or Level is missing" }
        }
        await prisma.userStudentRecord.upsert({
          where: {
            unique_user_student_record: {
              userId: userOrganization.userId,
              organizationId: userOrganization.organizationId,
            }
          },
          create: {
            studentId,
            User,
            Organization,
            Level,
            lrn,
            ...departmentId ? {Department} : {},
            ...programId ? {Program} : {}, 
            ...collegeId ? {College} : {},
            ...yearLevelId ? {YearLevel} :{}
          },
          update: {
            studentId,
            User,
            Organization,
            Level,
            lrn,
            ...departmentId ? {Department} : {},
            ...programId ? {Program} : {}, 
            ...collegeId ? {College} : {},
            ...yearLevelId ? {YearLevel} :{}
          }
        })
      }
      if(requirement === "employee_record") {
        if(!(employeeId && position)) {
          return {...response, message: "Employee ID or Position is missing"}
        }
        await prisma.userEmploymentRecord.upsert({
          where: {
            unique_user_employment: {
              userId: userOrganization.userId,
              organizationId: userOrganization.organizationId,
            }
          },
          create: {
            employeeId,
            designation,
            position,
            User,
            Organization,
            ...departmentId ? {Department} : {},
            ...collegeId ? {College} : {},
          },
          update: {
            employeeId,
            designation,
            position,
            User,
            Organization,
            ...departmentId ? {Department} : {},
            ...collegeId ? {College} : {},
          }
        })
      }
    }
    return {
      status: true,
      message: `Application to ${orgId} was successfully sent. Please wait for the approval from the organization.`,
      data: userOrganization
      
    }
  }, {
    timeout: 10000,
    maxWait: 5000
  })

  if(!(request.status && request.data)) throw new Error("Error sending membership request");
  const result = request.data

  const adminEmails = result.Organization.Users.filter(u => u.UserRole.name.toUpperCase() === "ADMIN" && u.status === "ACTIVE").map(u => u.User.email);

  const userName = `${result.User.firstName} ${result.User.lastName}`;
  const receiver = result.User.email;
  try {
    await Promise.all([
      notifyUser([receiver], result.Organization.name, userName),
      notifyAdmins([...adminEmails], result.Organization.name)
    ])
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
  return request;
}


const notifyAdmins = async (receiver: string[], orgName: string) => {
  const filePath = path.join(process.cwd(), "email-templates/org-membership-application.html");

  const emailTemplate = await fs.readFile(filePath, "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{orgName}", orgName).replaceAll("@{appName}", appName)
  const subject = `New membership application to ${orgName}`;

  await sendMail({
    subject,
    to: receiver,
    text: html,
    html
  })
}

const notifyUser = async (receiver: string[], orgName: string, userName: string) => {
  const filePath = path.join(process.cwd(), "email-templates/org-membership-request.html");
  const emailTemplate = await fs.readFile(filePath, "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{userName}", userName).replaceAll("@{appName}", appName).replaceAll("@{orgName}", orgName)
  const subject = `Membership application to ${orgName}`;
  
  await sendMail({
    subject,
    to: receiver,
    text: html,
    html
  })
}
