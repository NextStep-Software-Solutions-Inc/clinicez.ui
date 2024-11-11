"use server";

import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { getUserAction } from "@actions/users/user.action";
import { getHPsAction } from "@actions/hp.actions";
import { PERMISSIONS } from "@lib/permissions";

export type GetMedicationsFilters = {
    clinicId: number,
    patientId?: number,
    consultationTicketId?: number
    hpId?: number
}
export type GetMedications = Awaited<ReturnType<typeof getMedicationsAction>>;
export const getMedicationsAction = async (filters?: GetMedicationsFilters) => {
  let message = "Successfully fetched medications";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const [user, hps, myPermissions] = await Promise.all([
      getUserAction(session.user.sub),
      getHPsAction({ userId: session.user.sub }),
      getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" })
    ]);

    const myPermissionArray = myPermissions.map(permission => permission.name);

    const readAllClinicMedications = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:ALL"].name]
    const readOwnMedications = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:OWN"].name]
    const readCreatedMedications = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:CREATED"].name]

    const canReadAllClinicMedications = readAllClinicMedications.every(permission => myPermissionArray.includes(permission));
    const canReadOwnMedications = readOwnMedications.every(permission => myPermissionArray.includes(permission));
    const canReadCreatedMedications = readCreatedMedications.every(permission => myPermissionArray.includes(permission));

    if(!canReadAllClinicMedications && !canReadOwnMedications && !canReadCreatedMedications) throw new Error("You do not have permission to view medications");
    
    const { clinicId, patientId, consultationTicketId, hpId } = filters || {};
    const medications = await prismaTenant.medication.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        clinicId,
        consultationTicketId,
        OR: [
          {
            ...canReadAllClinicMedications ? {clinicId, patientId, hpId} : {},
          },
          {
            ...canReadOwnMedications ? {patientId: user.data?.id} : {},
          },
          {
            ...canReadCreatedMedications ? {hpId: {in: hps.map(hp => hp.id)}} : {},
          }
        ]
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

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" });
    const myPermissionArray = myPermissions.map(permission => permission.name);

    const createClinicMedicationPermissions = [PERMISSIONS.CLINIC["CREATE:CLINIC:MEDICATION"].name]

    const canCreateMedication = createClinicMedicationPermissions.every(permission => myPermissionArray.includes(permission));

    if(!canCreateMedication) throw new Error("You do not have permission to create medication"); 

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

type GetMedicationFilters = {
  clinicId: number
}
export type GetMedication = Awaited<ReturnType<typeof getMedicationAction>>;
export const getMedicationAction = async (medicationId: number, filters?: GetMedicationFilters) => {
  let message = `Successfully fetched medication with id: ${medicationId}`;
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Unauthorized");

    const [user, hps, myPermissions] = await Promise.all([
      getUserAction(session.user.sub),
      getHPsAction({ userId: session.user.sub }),
      getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" })
    ]);

    const myPermissionArray = myPermissions.map(permission => permission.name);

    const readAllClinicMedicationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:ALL"].name]
    const readOwnMedicationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:OWN"].name]
    const readCreatedMedicationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:CREATED"].name]

    const canReadAllClinicMedication = readAllClinicMedicationPermissions.every(permission => myPermissionArray.includes(permission));
    const canReadOwnMedication = readOwnMedicationPermissions.every(permission => myPermissionArray.includes(permission));
    const canReadCreatedMedication = readCreatedMedicationPermissions.every(permission => myPermissionArray.includes(permission));
    
    if(!canReadAllClinicMedication && !canReadOwnMedication && !canReadCreatedMedication) throw new Error("You do not have permission to view medications");
    
    const { clinicId } = filters || {};
    const medication = await prismaTenant.medication.findUniqueOrThrow({
      where: { 
        id: medicationId,
        clinicId,
        OR: [
          {
            ...canReadAllClinicMedication ? { clinicId } : {},
          },
          {
            ...canReadOwnMedication ? {patientId: user.data?.id} : {},
          },
          {
            ...canReadCreatedMedication ? {hpId: {in: hps.map(hp => hp.id)}} : {},
          }
        ]
      },
      include: {
        Prescriptions: true,
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

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "ORGANIZATION" });
    const myPermissionArray = myPermissions.map(permission => permission.name);

    const completeOrgMedicationPermissions = [PERMISSIONS.CLINIC["COMPLETE:CLINIC:MEDICATION"].name]

    const canCompleteMedication = completeOrgMedicationPermissions.every(permission => myPermissionArray.includes(permission));

    if(!canCompleteMedication) throw new Error("You do not have permission to complete medication");

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