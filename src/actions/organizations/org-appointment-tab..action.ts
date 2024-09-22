"use server";
import "server-only";

import prismaCommon from "@lib/prisma-common";
import { Prisma } from '@prisma/common/client';

export const getOrgAppointmentTabsAction = async (orgUid: string) => {
  try {
    const orgAppointmentTabs = await prismaCommon.orgAppointmentTab.findMany({
      where: { 
        Organization: {
          orgId: orgUid
        },
      },
      select: {
        AppointmentTab: {
          select: {
            name: true,
            description: true,
          }
        },
        OrgRoleAppointmentTabs: {
          select: {
            Role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    return {
      status: true,
      message: "Org appointment tabs fetched successfully",
      data: orgAppointmentTabs
    }
  } catch (error) {
    console.error(error);
    let errorMessage = "Error while fetching org appointment tabs";
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      errorMessage = "Organization not found";
    }
    return {
      status: false,
      message: errorMessage,
      data: []
    }
  }
}