"use server";

import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { getCachedSession } from "@actions/session.action";

export type GetMedicationsFilters = {
    clinicId?: number,
    patientId?: number,
    consultationTicketId?: number
}
export type GetMedications = Awaited<ReturnType<typeof getMedicationsAction>>;
export const getMedicationsAction = async (filters?: GetMedicationsFilters) => {
  let message = "Successfully fetched medications";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const { clinicId, patientId, consultationTicketId } = filters || {};
    const medications = await prismaTenant.medication.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        consultationTicketId,
        patientId,
        clinicId
      },
      include: {
        _count: {
          select: {
            MedicationDrugs: true,
            Prescriptions: true
          }
        }
      }
    })
    return { status: true, message, data: medications }
  } catch (error) {
    console.error(`Error while fetching medications: ${error}`);
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: [] };
  }
}

type CreateMedicationPayload = {
  clinicId: number
  hpId: number
  patientId: number
  consultationTicketId: number
  name: string
}
export const createMedicationAction = async (payload: CreateMedicationPayload) => {
  let message = "Successfully created medication";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const { clinicId, hpId, patientId, consultationTicketId, name } = payload;
    await prismaTenant.medication.create({
      data: {
        clinicId,
        hpId,
        patientId,
        consultationTicketId,
        name
      }
    });
    
    return { status: true, message };
  } catch (error) {
    console.error(`Error while creating medication: ${error}`);
    if (error instanceof Error) message = error.message;
    return { status: false, message};
  }
}


export type GetMedication = Awaited<ReturnType<typeof getMedicationAction>>;
export const getMedicationAction = async (medicationId: number) => {
  let message = `Successfully fetched medication with id: ${medicationId}`;
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const medication = await prismaTenant.medication.findUnique({
      where: { id: medicationId},
      include: {
        _count: {
          select: {
            MedicationDrugs: true,
            Prescriptions: true
          }
        }
      }
    })
    return { status: true, message, data: medication }
  } catch (error) {
    console.error(`Error while fetching medication: ${error}`);
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null };
  }
}

export const setMedicationCompletedAction = async (medicationId: number) => {

  let message = `Successfully completed medication with id: ${medicationId}`;
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    await prismaTenant.medication.update({
      where: { id: medicationId },
      data: {
        completedAt: new Date()
      }
    });
    return { status: true, message }
  } catch (error) {
    console.error(`Error while completing medication: ${error}`);
    if (error instanceof Error) message = error.message;
    return { status: false, message };
  }
}