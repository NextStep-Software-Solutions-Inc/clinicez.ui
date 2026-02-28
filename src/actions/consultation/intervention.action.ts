"use server";

import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { hasCodeProperty } from "@lib/utils";

export const createInterventionAction = async (data: FormData) => {
  let message = "Intervention added successfully";
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");

    const { consultationTicketId, actionId, details, clinicUid, hpId } = Object.fromEntries(data); 

    const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
    const myPermissionArray = myPermissions.map(p => p.name);
    const canWriteIntervention = [PERMISSIONS.CLINIC["WRITE:CLINIC:INTERVENTION"].name].some(p => myPermissionArray.includes(p));
    if (!canWriteIntervention) throw new Error("You do not have permission to create interventions.");

    const intervention  = await prisma.intervention.create({
      data: {
        ConsultationTicket: {
          connect: {id: Number(consultationTicketId)}
        },
        Action: {
          connect: {id: Number(actionId)}
        },
        Clinic: {
          connect: {clinicUid: String(clinicUid)}
        },
        HealthCareProvider: {
          connect: { id: Number(hpId)}
        },
        details: String(details)
      }
    });
    

    return { status: true,  message, data: intervention }
  } catch (error) {
    message = "Failed to create intervention";
    console.error(`Error creating intervention: ${error}`);
    if(error instanceof Error) message = error.message;
    return { status: false, message,  data: null }
  }
}

export type GetInterventions = Awaited<ReturnType<typeof getInterventionsAction>>;
export const getInterventionsAction = async (data: FormData) => {

  let message = "Interventions fetched successfully";

  try {
  
    const session = await getCachedSession();
    if(!session) throw new Error("User not authenticated.");
    
    const { consultationTicketId, clinicUid } = Object.fromEntries(data);

    const interventions = await prisma.intervention.findMany({
      where: {
        isActive: true,
        Clinic: {
          clinicUid: String(clinicUid)
        },
        ConsultationTicket: {
          id: Number(consultationTicketId)
        }
      },
      select: {
        id: true,
        details: true,
        hpId: true,
        createdAt: true,
        Action: {
          select: {
            id: true,
            name: true
          }
        },
      }
    });
    return { status: true, message, data: interventions }
  } catch (error) {
    let message = "Failed to fetch interventions";
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === 'P2025') message = "Consultation record not found";
    return { status: false, message, data: [] }
  }
}