"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { cache } from "react";
import { getCachedSession } from "../session.action";
import { sessionCheck } from "@/lib/auth";

export type getUserDefaultOrgsRole = Awaited<ReturnType<typeof getUserDefaultOrgsRole>>
export const getUserDefaultOrgsRole = withErrorHandling(cache(async (userId: string) => {

  await sessionCheck();

  const userDefaultOrgRole = await prismaClient.userDefaultOrganizationRole.findMany({
    where: {
      isActive: true,
      User: {
        userId
      }
    },
  });

  return {message: "User default orgs role fetched successfully", data: userDefaultOrgRole};
}));


export type GetUserDefaultOrg = Awaited<ReturnType<typeof getUserDefaultOrg>>
export const getUserDefaultOrg = withErrorHandling(cache(async (userId: string) => {

  await sessionCheck();

  const userDefaultOrg = await prismaClient.userDefaultOrganization.findFirst({
    where: {
      isActive: true,
      User: {
        userId
      }
    },
    select: {
      id: true,
      Organization: {
        select: {
          orgUid: true
        }
      }
    }
  });

  return {message: "User default org fetched successfully", data: userDefaultOrg};
}));