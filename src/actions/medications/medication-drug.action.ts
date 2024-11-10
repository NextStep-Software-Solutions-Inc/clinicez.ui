"use server";

import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { getCachedSession } from "@actions/session.action";
import { hasCodeProperty } from "@lib/utils";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";

export type GetMedicationDrugs = Awaited<ReturnType<typeof getMedicationDrugsAction>>;
export const getMedicationDrugsAction = async (medicationId: number) => {
  let message = "Successfully fetched medication drugs";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const [myPermissions] = await Promise.all([
      getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" }),
    ]);

    const myPermissionArray = myPermissions.map(permission => permission.name);

    const readMedicationDrugPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION_DRUG"].name]
    const canReadMedicationDrug = readMedicationDrugPermissions.every(permission => myPermissionArray.includes(permission));

    if(!canReadMedicationDrug) throw new Error("You do not have permission to remove medication drug");

    const medicationDrugs = await prismaTenant.medicationDrug.findMany({
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
    return { status: true, message, data: medicationDrugs }
  } catch (error) {
    console.error(`Error while fetching medication drugs: ${error}`);
    if (error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === "P2002") message = "Medication drugs not found";
    return { status: false, message, data: [] };
  }
}

type AddMedicationDrugPayload = {
  drugId: number,
  medicationId: number,
  dosage: string,
  quantity: number,
  notes?: string,
  daysCount?: number
  isGeneric?: boolean
}
export const addMedicationDrugAction = async (payload: AddMedicationDrugPayload) => {
  let message = "Successfully added medication drug";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const [myPermissions] = await Promise.all([
      getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" }),
    ]);

    const myPermissionArray = myPermissions.map(permission => permission.name);

    const addMedicationDrugPermissions = [PERMISSIONS.CLINIC["ADD:CLINIC:MEDICATION_DRUG"].name]
    const canAddMedicationDrug = addMedicationDrugPermissions.every(permission => myPermissionArray.includes(permission));

    if(!canAddMedicationDrug) throw new Error("You do not have permission to add medication drug");

    const { drugId, medicationId, dosage, quantity, notes, daysCount, isGeneric } = payload;

    await prismaTenant.medicationDrug.create({
      data: {
        medicationId,
        drugId,
        dosage,
        quantity,
        notes,
        isGeneric,
        daysCount
      }
    })

    return { status: true, message, data: {} }
  } catch (error) {
    console.error(`Error while adding medication drug: ${error}`);
    if (error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === "P2002") message = "Medication drug already exists";
    return { status: false, message, data: {} };
  }
}


export const removeMedicationDrugAction = async (medicationDrugId: number) => {
  let message = "Successfully deleted medication drug";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const [myPermissions] = await Promise.all([
      getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" }),
    ]);

    const myPermissionArray = myPermissions.map(permission => permission.name);

    const addMedicationDrugPermissions = [PERMISSIONS.CLINIC["REMOVE:CLINIC:MEDICATION_DRUG"].name]
    const canAddMedicationDrug = addMedicationDrugPermissions.every(permission => myPermissionArray.includes(permission));

    if(!canAddMedicationDrug) throw new Error("You do not have permission to remove medication drug");

    await prismaTenant.medicationDrug.delete({
      where: {
        id: medicationDrugId,
        Medication: {
          completedAt: null
        }
      }
    })

    return { status: true, message }
  } catch (error) {
    console.error(`Error while deleting medication drug: ${error}`);
    if (error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === "P2025") message = "Medication drug not found";
    return { status: false, message };
  }
}