"use server";
import "server-only";

import prismaCommon from "@lib/prisma-common";
import { Prisma } from '@prisma/common/client';
import { cache } from "react";

export type GetOrgAppointmentTabs = Awaited<ReturnType<typeof getOrgAppointmentTabsAction>>
export const getOrgAppointmentTabsAction = cache(async (orgUid: string) => {
  try {
    const orgAppointmentTabs = await prismaCommon.orgAppointmentTab.findMany({
      where: { 
        Organization: {
          orgId: orgUid
        },
      },
      select: {
        id: true,
        AppointmentTab: {
          select: {
            id: true,
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
})

export const setOrgAppointmentTabsAction = async (orgUid: string, appointmentTabIds: number[]) => {

  try {
    await prismaCommon.$transaction(async (prisma) => {
     
      const org = await prisma.organization.findUniqueOrThrow({
        where: {
          orgId: orgUid
        }
      })
      await prisma.orgRoleAppointmentTab.deleteMany({
        where: {
          OrgAppointmentTab: {
            orgId: org.id
          }
        }
      });
      await prisma.orgAppointmentTab.deleteMany({
        where: {
          orgId: org.id,
        },
      });
      await prisma.orgAppointmentTab.createMany({
        skipDuplicates: true,
        data: appointmentTabIds.map((appointmentTabId) => {
          return {
            orgId: org.id,
            appointmentTabId: appointmentTabId
          }
        })
      });
    });
    return {
      status: true,
      message: "Org appointment tabs set successfully",
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Error while setting org appointment tabs",
    }
  }
}

export const setOrgRoleAppointmentTabsAction = async (orgRoleId: number, orgAppointmentTabIds: number[]) => {
  console.log({orgRoleId, orgAppointmentTabIds});

  try {
    await prismaCommon.$transaction(async (prisma) => {
      await prisma.orgRoleAppointmentTab.deleteMany({
        where: {
          orgRoleId: orgRoleId
        }
      });
      await prisma.orgRoleAppointmentTab.createMany({
        skipDuplicates: true,
        data: orgAppointmentTabIds.map((id) => {
          return {
            orgRoleId,
            orgAppointmentTabId: id
          }
        })
      });
    });
    return {
      status: true,
      message: "Org appointment tabs set successfully",
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Error while setting org appointment tabs",
    }
  }
}