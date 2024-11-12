"use server";

import "server-only";
import prisma from "@lib/prisma";

type GetClinicRoleInitialPermissionsFilters = {
  clinicUid: string;
  clinicRoleId: number;
}
export type GetClinicRoleInitialPermissions = Awaited<ReturnType<typeof getClinicRoleInitialPermissionsAction>>;
export async function getClinicRoleInitialPermissionsAction({clinicRoleId, clinicUid}: GetClinicRoleInitialPermissionsFilters) {

  const clinicRoleInitialPermissions = await prisma.clinicRoleInitialPermission.findMany({
    where: {
      clinicRoleId: clinicRoleId,
      Clinic: {
        clinicUid
      }
    }, 
    select: {
      id: true,
      clinicId: true,
      Permission: {
        select: {
          id: true,
          name: true,
          description: true,
        }
      }
    }
  })
  return clinicRoleInitialPermissions;
}


type SetClinicRoleInitialPermissionsPayload = {
  clinicRoleId: number,
  clinicUid: string,
  permissionIds: number[]
}
export const setClinicRoleInitialPermissionsAction = async ({clinicRoleId, clinicUid, permissionIds}:SetClinicRoleInitialPermissionsPayload) => {

  try {
    await prisma.$transaction(async (prisma) => {
      const clinic = await prisma.clinic.findUniqueOrThrow({
        where: {
          clinicUid
        }
      })
      await prisma.clinicRoleInitialPermission.deleteMany({
        where: {
          clinicRoleId: clinicRoleId,
          clinicId: clinic.id
        }
      })
      await prisma.clinicRoleInitialPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          clinicRoleId,
          permissionId,
          clinicId: clinic.id
        }))
      })
    })
    return {
      status: true,
      message: "Permission updated successfully"
    }
  } catch (error) {
    console.error(`Error while updating permissions: ${error}`);
    return {
      status: false,
      message: "Error while updating permissions"
    }
  }
}