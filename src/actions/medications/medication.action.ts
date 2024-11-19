"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { getUserAction } from "@actions/users/user.action";
import { getHPsAction } from "@actions/hp.actions";
import { PERMISSIONS } from "@lib/permissions";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetMedicationsFilters = {
    clinicId: number,
    patientId?: number,
    consultationTicketId?: number
    hpId?: number
}
export type GetMedications = Awaited<ReturnType<typeof getMedicationsAction>>;
export const getMedicationsAction = withErrorHandling(async (filters?: GetMedicationsFilters) => {
 
  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const [user, hps, myPermissions] = await Promise.all([
    getUserAction(session.user.sub),
    getHPsAction({ userId: session.user.sub }),
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" })
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
  const medications = await prisma.medication.findMany({
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
  
  return {message:"Successfully fetched medications", data: medications }
})

type CreateMedicationPayload = {
  clinicUid: string
  hpId: number
  patientId: number
  consultationTicketId: number
  name: string
}
export const createMedicationAction = withErrorHandling(async (payload: CreateMedicationPayload) => {
  
  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const myPermissionArray = myPermissions.map(permission => permission.name);

  const createClinicMedicationPermissions = [PERMISSIONS.CLINIC["CREATE:CLINIC:MEDICATION"].name]

  const canCreateMedication = createClinicMedicationPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canCreateMedication) throw new Error("You do not have permission to create medication"); 

  const { clinicUid, hpId, patientId, consultationTicketId, name } = payload;
  await prisma.medication.create({
    data: {
      Clinic: {
        connect: {
          clinicUid
        }
      },
      ConsultationTicket: {
        connect: {
          id: consultationTicketId
        }
      },
      HealthCareProvider: {
        connect: {
          id: hpId
        }
      },
      Patient: {
        connect: {
          id: patientId
        }
      },
      name
    }
  });
    
  return { message: "Successfully created medication", data: undefined };
 
})

type GetMedicationFilters = {
  clinicUid: string
}
export type GetMedication = Awaited<ReturnType<typeof getMedicationAction>>;
export const getMedicationAction = withErrorHandling(async (medicationId: number, filters?: GetMedicationFilters) => {

  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const [myPermissions] = await Promise.all([
    getPermissionsAction({ userId: session.user.sub, type: "CLINIC" })
  ]);

  const myPermissionArray = myPermissions.map(permission => permission.name);

  const readAllClinicMedicationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:ALL"].name]
  const readOwnMedicationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:OWN"].name]
  const readCreatedMedicationPermissions = [PERMISSIONS.CLINIC["READ:CLINIC:MEDICATION:CREATED"].name]

  const canReadAllClinicMedication = readAllClinicMedicationPermissions.every(permission => myPermissionArray.includes(permission));
  const canReadOwnMedication = readOwnMedicationPermissions.every(permission => myPermissionArray.includes(permission));
  const canReadCreatedMedication = readCreatedMedicationPermissions.every(permission => myPermissionArray.includes(permission));
    
  if(!canReadAllClinicMedication && !canReadOwnMedication && !canReadCreatedMedication) throw new Error("You do not have permission to view medications");
    
  const { clinicUid } = filters || {};
  const medication = await prisma.medication.findUniqueOrThrow({
    where: { 
      id: medicationId,
      Clinic: {
        clinicUid
      },
      OR: [
        {
          ...canReadAllClinicMedication ? { Clinic: { clinicUid } } : {},
        },
        {
          ...canReadOwnMedication ? { Patient: { userId: session.user.sub } } : {},
        },
        {
          ...canReadCreatedMedication ? { 
            HealthCareProvider: {
              User: {
                userId: session.user.sub
              }
            }
          } : {},
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
    
  return { message: `Successfully fetched medication with id: ${medicationId}`, data: medication }
})

export const setMedicationCompletedAction = withErrorHandling(async (medicationId: number) => {
  const session = await getCachedSession();
  if(!session) throw new Error("Unauthorized");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const myPermissionArray = myPermissions.map(permission => permission.name);

  const completeOrgMedicationPermissions = [PERMISSIONS.CLINIC["COMPLETE:CLINIC:MEDICATION"].name]

  const canCompleteMedication = completeOrgMedicationPermissions.every(permission => myPermissionArray.includes(permission));

  if(!canCompleteMedication) throw new Error("You do not have permission to complete medication");

  await prisma.medication.update({
    where: { id: medicationId },
    data: {
      completedAt: new Date()
    }
  });
    
  return {message: `Successfully completed medication with id: ${medicationId}`, data: undefined}
})