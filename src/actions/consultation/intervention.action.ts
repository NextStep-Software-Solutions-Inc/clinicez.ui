"use server";

import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { PrismaClientKnownRequestError } from '@prisma/tenant/client/runtime/library';

export const createInterventionAction = async (data: FormData) => {
  const { consultationRecordId, actionId, details, orgUid, hpId } = Object.fromEntries(data); 

  
  try {
    const intervention  = await prismaTenant.intervention.create({
      data: {
        consultationRecordId: Number(consultationRecordId),
        actionId: Number(actionId),
        details: String(details),
        orgUid: String(orgUid),
        hpId: Number(hpId)
      }
    });
    

    return {
      status: true,
      message: "Intervention added successfully",
      data: intervention
    }
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "Failed to add intervention",
      data: null
    }
  }
}

export type GetInterventions = Awaited<ReturnType<typeof getInterventionsAction>>;
export const getInterventionsAction = async (data: FormData) => {
  const { consultationRecordId, orgUid } = Object.fromEntries(data);
  try {
    const interventions = await prismaTenant.intervention.findMany({
      where: {
        isActive: true,
        orgUid: String(orgUid),
        consultationRecordId: Number(consultationRecordId)
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
    return {
      status: true,
      message: "Interventions fetched successfully",
      data: interventions
    }
  } catch (error) {
    let message = "Failed to fetch interventions";
    if(error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      message = "Consultation record not found";
    }
    return {
      status: false,
      message,
      data: []
    }
  }
}