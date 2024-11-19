"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { ClinicMemberStatus } from "@/types";

type CreateClinicRolePayload = {
  name: string;
}

export const createClinicRoleAction = async (payload: CreateClinicRolePayload) => {
  let message = "Clinic role created successfully"
  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    const { name } = payload;
    const newClinicRole = await prisma.clinicRole.create({
      data: {
        name,
      }
    })
    return { status: true, message, data: newClinicRole }
  } catch (error) {
    console.error(`Error while creating clinic role: ${error}`);
    message = "Error while creating role";
    if(error instanceof Error) message = error.message;
    return { status: false,  message: "Error while creating role", data: null }
  }
}

type FiltersType = {
    roleName?: string;
  }
  
export type GetClinicRoles = Awaited<ReturnType<typeof getClinicRolesAction>>
export const getClinicRolesAction = cache(async (filter?: FiltersType) => {
  const {roleName} = filter || { status: "ACTIVE"};
  
  const roles = await prisma.clinicRole.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      isActive: true,
      ...roleName ? { name: roleName } : {},
    },
    select: {
      id: true,
      name: true,
      ClinicMembers: {
        select: {
          status: true,
          User: {
            select: {
              id: true,
              userId: true,
            }
          }
        }
      },
      UserDefaultClinicRoles: {
    
        select: {
          id: true,
          Clinic: {
            select: {
              clinicUid: true,
            }
          },
          ClinicRole: {
            select: {
              id: true,
              name: true
            }
          },
          User: {
            select: {
              userId: true
            }
          }
        }
      },
      ClinicRoleAppointmentTabs: {
        select: {
          clinicRoleId: true,
          ClinicAppointmentTab: {
            select: {
              id: true,
              AppointmentTab: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      },
    }
  })

  return roles;
})

export const deleteClinicRoleAction = async (clinicRoleId: number) => {

  let message = "Clinic role deleted successfully"

  try {

    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");

    await prisma.clinicRole.update({
      where: {
        isActive: true,
        id: clinicRoleId
      },
      data: { isActive: false, deletedAt: new Date() }
    })
    return { status: true,  }
  } catch (error) {
    console.error(`Error while deleting role: ${error}`);
    message = "Error while deleting role";
    if(error instanceof Error) message = error.message;
    return { status: false, message }
  }
}