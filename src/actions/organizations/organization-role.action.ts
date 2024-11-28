"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { OrganizationMemberStatus } from "@/types";
import { withErrorHandling } from "@/lib/with-error-handling";

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


export const setOrganizationRoleRequirementsAction = async (orgRoleId: number, requirements: string[]) => {
  let message = "Role requirements updated successfully"
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    await prisma.organizationRole.update({
      where: {
        isActive: true,
        id: orgRoleId
      },
      data: { requirements }
    })
    return { status: true, message} 
  } catch (error) {
    console.error(`Error while updating role requirements: ${error}`);
    message = "Error while updating role requirements";
    if(error instanceof Error) message = error.message;
    return { status: false, message}
  }
}

export const deleteOrganizationRoleAction = async (orgRoleId: number) => {

  let message = "Role deleted successfully"

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    await prisma.organizationRole.update({
      where: {
        isActive: true,
        id: orgRoleId
      },
      data: { isActive: false }
    })
    return { status: true, message }
  } catch (error) {
    console.error(`Error while deleting role: ${error}`);
    message = "Error while deleting role";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}
