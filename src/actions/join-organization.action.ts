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
}

export async function joinOrganizationAction(payload: JoinOrganizationPayload) {
  
  const { userId, orgId, orgRoleId} = payload
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

  if(!(userOrganization)) throw new Error("Error sending membership request");
  const adminEmails = userOrganization.Organization.Users.filter(u => u.UserRole.name.toUpperCase() === "ADMIN" && u.status === "ACTIVE").map(u => u.User.email);
  const userName = `${userOrganization.User.firstName} ${userOrganization.User.lastName}`;
  const applicantEmail = userOrganization.User.email;
  try {
    await Promise.all([
      notifyApplicant([applicantEmail], userOrganization.Organization.name, userName),
      notifyAdmins([...adminEmails], userOrganization.Organization.name)
    ])
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }

  return {
    status: true,
    message: `Application to ${orgId} was successfully sent. Please wait for the approval from the organization.`,
    data: userOrganization
  }
}

const notifyAdmins = async (applicantEmail: string[], orgName: string) => {
  const filePath = path.join(process.cwd(), "email-templates/org-membership-application.html");

  const emailTemplate = await fs.readFile(filePath, "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{orgName}", orgName).replaceAll("@{appName}", appName)
  const subject = `New membership application to ${orgName}`;

  await sendMail({
    subject,
    to: applicantEmail,
    text: html,
    html
  })
}

const notifyApplicant = async (applicantEmail: string[], orgName: string, userName: string) => {
  const filePath = path.join(process.cwd(), "email-templates/org-membership-request.html");
  const emailTemplate = await fs.readFile(filePath, "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{userName}", userName).replaceAll("@{appName}", appName).replaceAll("@{orgName}", orgName)
  const subject = `Membership application to ${orgName}`;
  
  await sendMail({
    subject,
    to: applicantEmail,
    text: html,
    html
  })
}
