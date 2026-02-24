"use server";

import prisma from "@lib/prisma";
import fs from 'fs/promises';
import { sendMail } from '@actions/email.action';
import path from 'path';
import { capitalize, hasCodeProperty } from "@lib/utils";
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { createNotification, createNotifications } from "@/actions/notifications/notification.action";

export type JoinOrganizationPayload = {
  userId: string;
  orgUid: string;
  orgRoleId: number;
}

export const joinOrganizationAction = withErrorHandling(async (payload: JoinOrganizationPayload) => {
  let message = "Successfully sent membership request";

  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { userId, orgUid, orgRoleId } = payload

  // Find the user by userId string first
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId, isActive: true },
    select: { id: true },
  });

  const userOrganization = await prisma.organizationMember.create({
    data: {
      OrganizationRole: {
        connect: { id: orgRoleId }
      },
      User: {
        connect: { id: currentUser.id }
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
                  id: true,
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

  if (!(userOrganization)) throw new Error("Error sending membership request");

  const adminEmails = userOrganization.Organization.OrganizationMembers.filter(u => u.OrganizationRole.name.toUpperCase() === "ADMIN" && u.status === "ACTIVE").map(u => u.User.email);
  const applicantEmail = userOrganization.User.email;
  const applicantName = capitalize(`${userOrganization.User.firstName} ${userOrganization.User.lastName}`);

  await sendEmailNotifications(adminEmails, userOrganization.Organization.name, applicantName, applicantEmail);

  // In-app notification: notify the applicant their request was submitted
  await createNotification({
    userId: currentUser.id,
    type: "ORG_MEMBERSHIP_APPLIED",
    title: "Membership Request Sent",
    message: `Your membership request to ${userOrganization.Organization.name} has been submitted and is pending review.`,
  });

  // In-app notification: notify active admins of the new application
  const adminUserIds = userOrganization.Organization.OrganizationMembers
    .filter((u) => u.OrganizationRole.name.toUpperCase() === "ADMIN" && u.status === "ACTIVE")
    .map((u) => u.User.id);
  if (adminUserIds.length > 0) {
    await createNotifications(
      adminUserIds.map((adminId) => ({
        userId: adminId,
        type: "ORG_MEMBERSHIP_APPLIED" as const,
        title: "New Membership Application",
        message: `${applicantName} has applied to join ${userOrganization.Organization.name}.`,
      })),
    );
  }

  message = `Successfully sent membership request to ${userOrganization.Organization.name}`;
  return { message, data: userOrganization }

}, async error => {
  if (hasCodeProperty(error) && error.code === "P2002") return "User is already a member of the organization";
  if (error instanceof Error && error.message === "User email is not verified") return "Your email address is not verified. Please verify your email before joining an organization.";
  return "An error occurred while sending the membership request. Please try again later.";
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
