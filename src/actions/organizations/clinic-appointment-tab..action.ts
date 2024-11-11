"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { hasCodeProperty } from "@lib/utils";

export type GetOrgAppointmentTabs = Awaited<ReturnType<typeof getClinicAppointmentTabsAction>>
export const getClinicAppointmentTabsAction = cache(async (clinicUid: string) => {
  let message = "Clinic appointment tabs fetched successfully";
  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const clinicAppointmentTabs = await prisma.clinicAppointmentTab.findMany({
      where: { 
        Clinic: {
          clinicUid
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
        ClinicRoleAppointmentTabs: {
          select: {
            ClinicMemberRole: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
      
    return { status: true, message,data: clinicAppointmentTabs }
  } catch (error) {
    console.error(`Error while fetching clinic appointment tabs: ${error}`);
    message = "Error while fetching clinic appointment tabs";
    if(hasCodeProperty(error) && error.code === 'P2025')  message = "Clinic not found";
    return { status: false, message,data: []}
  }
})

export const setClinicAppointmentTabsAction = async (clinicUid: string, appointmentTabIds: number[]) => {
  let message = "Clinic appointment tabs set successfully";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    await prisma.$transaction(async (prisma) => {
      const clinic = await prisma.clinic.findUniqueOrThrow({
        where: {
          clinicUid
        }
      })
      await prisma.clinicRoleAppointmentTab.deleteMany({
        where: {
          ClinicAppointmentTab: {
            Clinic: {
              clinicUid
            }
          }
        }
      });
      await prisma.clinicAppointmentTab.deleteMany({
        where: {
          Clinic: {
            clinicUid
          }
        },
      });
      await prisma.clinicAppointmentTab.createMany({
        skipDuplicates: true,
        data: appointmentTabIds.map((appointmentTabId) => {
          return {
            clinicId: clinic.id,
            appointmentTabId: appointmentTabId
          }
        })
      });
    });
    return { status: true, message}
  } catch (error) {
    console.error(`Error while setting clinic appointment tabs: ${error}`);
    message = "Error while setting clinic appointment tabs";
    if(error instanceof Error) message = error.message
    return { status: false, message }
  }
}

export const setClinicRoleAppointmentTabsAction = async (clinicRoleId: number, clinicAppointmentTabIds: number[]) => {
  let message = "Clinic appointment tabs set successfully";
  try {
    
    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    await prisma.$transaction(async (prisma) => {
      await prisma.clinicRoleAppointmentTab.deleteMany({
        where: {
          clinicRoleId
        }
      });
      await prisma.clinicRoleAppointmentTab.createMany({
        skipDuplicates: true,
        data: clinicAppointmentTabIds.map((id) => {
          return {
            clinicRoleId,
            clinicAppointmentTabId: id
          }
        })
      });
    });
    return {status: true, message }
  } catch (error) {
    console.error(`Error while setting clinic appointment tabs: ${error}`);
    message = "Error while setting clinic appointment tabs";
    if(error instanceof Error) message = error.message;
    return { status: false, message}
  }
}