"use server";

import prismaTenant from '@lib/prisma-tenant';
import { getCachedSession } from '@actions/session.action';
import 'server-only'
import { getPermissionsAction } from '@actions/permission.action';

type UpsertPreAssessmentNotePayload = {
    appointmentId: number;
    assessment: string;
    homeInstructions?: string;
    remarks: string;
    orgUid: string;
}

export const upsertPreAssessmentNoteAction = async ({appointmentId, orgUid, assessment, homeInstructions, remarks}: UpsertPreAssessmentNotePayload) => {
  const session = await getCachedSession()
  
  if(!session) return {
    status: false,
    message: "Session not found",
    data: null
  }

  const writePreAssessmentNotePermissions = ["write:org:pre-assessment"]
  const myPermissions = await getPermissionsAction(session.user.sub)
  const myPermissionArray = myPermissions.map(permission => permission.name)
  const writePermission = writePreAssessmentNotePermissions.every(permission => myPermissionArray.includes(permission))
  
  if(!writePermission) return {
    status: false,
    message: "You do not have permission to write pre-assessment notes",
    data: null
  }
  
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
    data: null
  }
}

export type GetPreAssessmentNotes = Awaited<ReturnType<typeof getPreAssessmentNotesAction>>
export const getPreAssessmentNotesAction = async (appointmentId: number) => {
  const session = await getCachedSession()
  if(!session) return {
    status: false,
    message: "Session not found",
    data: []
  }

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
}