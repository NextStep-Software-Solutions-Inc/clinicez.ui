"use server";

import prismaTenant from '@lib/prisma-tenant';
import { getCachedSession } from '@actions/session.action';
import 'server-only'
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';

type UpsertPreAssessmentNotePayload = {
    appointmentId: number;
    assessment: string;
    homeInstructions?: string;
    remarks: string;
    orgUid: string;
}

export const upsertPreAssessmentNoteAction = async ({appointmentId, orgUid, assessment, homeInstructions, remarks}: UpsertPreAssessmentNotePayload) => {
  const session = await getCachedSession()
  
  try {
    if(!session) throw new Error("User not authenticated.")
  
    const myPermissions = await getPermissionsAction({  userId:session.user.sub, type: "ORGANIZATION" })
    const writePreAssessmentNotePermissions = [PERMISSIONS.CLINIC["WRITE:ORG:PRE_ASSESSMENT_NOTE"].name]
    const myPermissionArray = myPermissions.map(permission => permission.name)
    const canWritePermission = writePreAssessmentNotePermissions.every(permission => myPermissionArray.includes(permission))
    
    if(!canWritePermission) throw new Error("You do not have permission to write pre-assessment note.")
    
    await prismaTenant.preAssessmentNote.upsert({
      where: {
        unique_appointment_created_by: {
          appointmentId,
          createdBy: session.user.email
        }
      },
      create: {
        appointmentId,
        orgUid,
        assessment,
        homeInstructions,
        remarks,
        createdBy: session.user.email,
        PreConsultationNoteAttribute:{
          create: {}
        }
      },
      update: {
        assessment,
        homeInstructions,
        remarks,
      }
    })
    return {
      status: true,
      message: "Pre-consultation note created successfully",
    }
  } catch (error) {
    console.error(`Error upserting pre-assessment note: ${error}`);
    let message = "An error occurred while updating pre-assessment note.";
    if(error instanceof Error) message = error.message;
    return {
      status: false,
      message,
    }
    
  }
}

export type GetPreAssessmentNotes = Awaited<ReturnType<typeof getPreAssessmentNotesAction>>
export const getPreAssessmentNotesAction = async (appointmentId: number) => {
  const session = await getCachedSession()
  try {
    if(!session) throw new Error("User not authenticated.")

    const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "ORGANIZATION"})
    const readPreAssessmentNotePermissions = [PERMISSIONS.CLINIC["READ:ORG:PRE_ASSESSMENT_NOTE"].name]
    const myPermissionArray = myPermissions.map(permission => permission.name)
    const canReadPermission = readPreAssessmentNotePermissions.every(permission => myPermissionArray.includes(permission))

    if(!canReadPermission) throw new Error("You do not have permission to read pre-assessment note.")

  
    const preAssessmentNote = await prismaTenant.preAssessmentNote.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        appointmentId
      }
    })
    return {
      status: true,
      message: "Pre-consultation note fetched successfully",
      data: preAssessmentNote
    }
  } catch (error) {
    console.error(`Error fetching pre-assessment note: ${error}`);
    let message = "An error occurred while fetching pre-assessment note.";
    if(error instanceof Error) message = error.message;
    return {
      status: false,
      message,
      data: []
    }
  }
}