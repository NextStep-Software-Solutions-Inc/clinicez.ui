"use server";

import prisma from "@lib/prisma";
import fs from 'fs/promises';
import { sendMail } from '@actions/email.action';
import path from 'path';
import { capitalize, hasCodeProperty } from "@lib/utils";
import { getCachedSession } from "../session.action";
import { managementClient } from "@/services/auth0/management-client";
import { withErrorHandling } from "@/lib/with-error-handling";

export type JoinOrganizationPayload = {
  userId: string;
  orgUid: string;
  orgRoleId: number;
}

export const joinOrganizationAction = withErrorHandling(async (payload: JoinOrganizationPayload)  =>{
  
  let message = "Successfully sent membership request";

  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");
    
  const auth0User = await managementClient.users.get({id: payload.userId})
  if(!auth0User.data.email_verified) throw new Error("User email is not verified")

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
  const applicantEmail = userOrganization.User.email;
  const applicantName = capitalize(`${userOrganization.User.firstName} ${userOrganization.User.lastName}`);
  
  await sendEmailNotifications(adminEmails, userOrganization.Organization.name, applicantName, applicantEmail);
  message = `Successfully sent membership request to ${userOrganization.Organization.name}`;
  return { message, data: userOrganization }
 
}, error => {
  if(hasCodeProperty(error) && error.code === "P2002") return "User is already a member of the organization";
})

const sendEmailNotifications = async (adminEmails: string[], orgName: string, applicantName: string, applicantEmail: string) => {
  try {
    await Promise.all([
      notifyApplicant([applicantEmail], orgName, applicantName),
      notifyAdmins([...adminEmails], orgName, applicantName)
    ])
  } catch (error) {
    console.error(`Error sending email notifications: ${error}`);
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
