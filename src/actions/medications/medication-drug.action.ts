"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { hasCodeProperty } from "@lib/utils";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetMedicationDrugs = Awaited<ReturnType<typeof getMedicationDrugsAction>>;
export const getMedicationDrugsAction = withErrorHandling(async (medicationId: number) => {

  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ]);

  const myPermissionArray = myPermissions.map(permission => permission.name);

  const readMedicationDrugPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION_DRUG"].name]
  const canReadMedicationDrug = readMedicationDrugPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canReadMedicationDrug) throw new Error("You do not have permission to remove medication drug");

  const medicationDrugs = await prisma.medicationDrug.findMany({
    where: {
      medicationId
    },
    select: {
      id: true,
      Drug: {
        select: {
          brandName: true,
          genericName: true,
        }
      },
      dosage: true,
      quantity: true,
      unit: true,
      isGeneric: true,
      notes: true,
      daysCount: true
    }
  })
  return {message: "Successfully fetched medication drugs", data: medicationDrugs }
 
}, error => {
  if(hasCodeProperty(error) && error.code === "P2002") return "Medication drugs not found";
  return "Failed to fetch medication drugs";
})

type AddMedicationDrugPayload = {
  drugId: number,
  medicationId: number,
  dosage: string,
  quantity: number,
  unit: string,
  notes?: string,
  daysCount?: number
  isGeneric?: boolean
}
export const addMedicationDrugAction = withErrorHandling(async (payload: AddMedicationDrugPayload) => {

  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ]);

  const myPermissionArray = myPermissions.map(permission => permission.name);

  const addMedicationDrugPermissions = [PERMISSIONS.CLINIC["ADD:CLINIC:MEDICATION_DRUG"].name]
  const canAddMedicationDrug = addMedicationDrugPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canAddMedicationDrug) throw new Error("You do not have permission to add medication drug");

  const { drugId, medicationId, dosage, quantity, unit, notes, daysCount, isGeneric } = payload;

  await prisma.medicationDrug.create({
    data: {
      medicationId,
      drugId,
      dosage,
      quantity,
      unit,
      notes,
      isGeneric,
      daysCount
    }
  })

  return { message: "Successfully added medication drug", data: {} }

}, error => {
  if(hasCodeProperty(error) && error.code === "P2002") return "Medication drug already exists";
  return "Failed to add medication drug";
})


export const removeMedicationDrugAction = withErrorHandling(async (medicationDrugId: number) => {

  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" }),
  ]);

  const myPermissionArray = myPermissions.map(permission => permission.name);

  const addMedicationDrugPermissions = [PERMISSIONS.CLINIC["REMOVE:CLINIC:MEDICATION_DRUG"].name]
  const canAddMedicationDrug = addMedicationDrugPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canAddMedicationDrug) throw new Error("You do not have permission to remove medication drug");

  await prisma.medicationDrug.delete({
    where: {
      id: medicationDrugId,
      Medication: {
        completedAt: null
      }
    }
  })

  return {message: "Successfully deleted medication drug", data: undefined }

}, error => {
  if(hasCodeProperty(error) && error.code === "P2025") return  "Medication drug not found";
  return "Failed to delete medication drug";
})