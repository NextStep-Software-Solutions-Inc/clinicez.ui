"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";

type CreateOrgRolePayload = {
  orgUid: string;
  name: string;
  description: string;
}

export const createOrganizationRoleAction = async (payload: CreateOrgRolePayload) => {
  let message = "Organization role created successfully"
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    const { orgUid, name, description } = payload;
    const newOrgRole = await prisma.organizationRole.create({
      data: {
        Organization: {
          connect: {
            orgUid
          }
        },
        name,
        description,
        requirements: [],
      }
    })
    return { status: true, message, data: newOrgRole }
  } catch (error) {
    console.error(`Error while creating organization role: ${error}`);
    message = "Error while creating role";
    if(error instanceof Error) message = error.message;
    return { status: false,  message: "Error while creating role", data: null }
  }
}

export type GetOrganizationRolesFilters = {
    orgUid?: string;
    userId?: string;
  }
  
export type GetOrganizationRoles = Awaited<ReturnType<typeof getOrganizationRolesAction>>
export const getOrganizationRolesAction = withErrorHandling(cache(async (filters: GetOrganizationRolesFilters) => {

  await sessionCheck();

  const {orgUid, userId} = filters || {};
  
  const roles = await prisma.organizationRole.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      isActive: true,
      ...userId ? {
        OrganizationMembers: {
          some: {
            User: {
              userId
            }
          }
        }
      }: {},
      ...orgUid ? { Organization: { orgUid } } : {}

    },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      requirements: true,
    }
  })
  
  
  return {message: "Organization roles fetched successfully", status: true, data: roles};
}))


export const setOrganizationRoleRequirementsAction = withErrorHandling(async (orgRoleId: number, requirements: string[]) => {

  await sessionCheck();

  await prisma.organizationRole.update({
    where: {
      isActive: true,
      id: orgRoleId
    },
    data: { requirements }
  })
  return { message: "Role requirements updated successfully", data: null } 
 
})

export const deleteOrganizationRoleAction = withErrorHandling(async (orgRoleId: number) => {

  await sessionCheck();

  await prisma.organizationRole.update({
    where: {
      isActive: true,
      id: orgRoleId
    },
    data: { isActive: false }
  })
  return { message: "Role deleted successfully", data: null }

})
