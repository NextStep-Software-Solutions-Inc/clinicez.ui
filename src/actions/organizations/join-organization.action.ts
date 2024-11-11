"use server";

import prisma from "@lib/prisma";
import fs from 'fs/promises';
import { sendMail } from '@actions/email.action';
import path from 'path';
import { capitalize } from "@lib/utils";

export type JoinOrganizationPayload = {
  userId: string;
  orgUid: string;
  orgRoleId: number;
}

export async function joinOrganizationAction(payload: JoinOrganizationPayload) {
  
  const { userId, orgUid, orgRoleId} = payload
  const userOrganization = await prisma.organizationMember.create({
    data: {
      OrganizationRole: {
        connect: { id: orgRoleId  }
      },
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgUid }
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
      OrganizationRole: {
        select: {
          requirements: true
        }
      },
      Organization: {
        select: {
          name: true,
          OrganizationMembers: {
            select: {
              User: {
                select: {
                  email: true
                }
              },
              status: true,
              OrganizationRole: {
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
  const adminEmails = userOrganization.Organization.OrganizationMembers.filter(u => u.OrganizationRole.name.toUpperCase() === "ADMIN" && u.status === "ACTIVE").map(u => u.User.email);
  const userName = `${userOrganization.User.firstName} ${userOrganization.User.lastName}`;
  const applicantEmail = userOrganization.User.email;
  const applicantName = capitalize(`${userOrganization.User.firstName} ${userOrganization.User.lastName}`);
  try {
    await Promise.all([
      notifyApplicant([applicantEmail], userOrganization.Organization.name, userName),
      notifyAdmins([...adminEmails], userOrganization.Organization.name, applicantName)
    ])
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }

  return {
    status: true,
    message: `Application to ${orgUid} was successfully sent. Please wait for the approval from the organization.`,
    data: userOrganization
  }
}

const notifyAdmins = async (applicantEmail: string[], orgName: string, applicant: string) => {
  const filePath = path.join(process.cwd(), "email-templates/org-membership-application.html");

  const emailTemplate = await fs.readFile(filePath, "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{orgName}", orgName).replaceAll("@{appName}", appName).replaceAll("@{applicant}", applicant)
  const subject = `${applicant} wants to join ${orgName}`;

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
