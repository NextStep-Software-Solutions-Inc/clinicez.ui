"use server";

import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { getCachedSession } from "@actions/session.action";
import { hasCodeProperty } from "@lib/utils";

export type GetMedicationDrugs = Awaited<ReturnType<typeof getMedicationDrugsAction>>;
export const getMedicationDrugsAction = async (medicationId: number) => {
  let message = "Successfully fetched medication drugs";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

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


export const deleteMedicationDrugAction = async (medicationDrugId: number) => {
  let message = "Successfully deleted medication drug";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

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