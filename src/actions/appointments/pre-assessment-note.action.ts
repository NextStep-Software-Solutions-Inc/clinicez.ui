"use server";

import 'server-only'
import prisma from '@lib/prisma';
import { getCachedSession } from '@actions/session.action';
import { getPermissionsAction } from '@actions/permission.action';
import { PERMISSIONS } from '@lib/permissions';
import { withErrorHandling } from '@/lib/with-error-handling';
import { tr } from '@faker-js/faker';
import { Prisma } from '@prisma/client';

type UpsertPreAssessmentNotePayload = {
    appointmentId: number;
    assessment: string;
    homeInstructions?: string;
    remarks: string;
    clinicUid: string;
}

export const upsertPreAssessmentNoteAction = withErrorHandling(async ({appointmentId, clinicUid, assessment, homeInstructions, remarks}: UpsertPreAssessmentNotePayload) => {
  
  const session = await getCachedSession()
  if(!session) throw new Error("User not authenticated.")
  
  const myPermissions = await getPermissionsAction({  userId:session.user.sub, type: "CLINIC" })
  const writePreAssessmentNotePermissions = [PERMISSIONS.CLINIC["WRITE:CLINIC:PRE_ASSESSMENT_NOTE"].name]
  const myPermissionArray = myPermissions.map(permission => permission.name)
  const canWritePermission = writePreAssessmentNotePermissions.every(permission => myPermissionArray.includes(permission))
    
  if(!canWritePermission) throw new Error("You do not have permission to write pre-assessment note.")
    
  await prisma.$transaction(async (prisma) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: {  userId: session.user.sub }, select: {id: true}
    })
    await prisma.preAssessmentNote.upsert({
      where: {
        unique_appointment_created_by: {
          appointmentId,
          createdBy: user.id
        }
      },
      create: {
        Appointment: {
          connect: {
            id: appointmentId
          }
        },
        Clinic: {
          connect: {
            clinicUid
          }
        },
        assessment,
        homeInstructions,
        remarks,
        CreatedBy: {
          connect: {
            userId: session.user.sub
          }
        },
        PreAssessmentNoteAttribute:{
          create: {}
        }
      },
      update: {
        assessment,
        homeInstructions,
        remarks,
      }
    })
  }, {
    maxWait: 10000,
    timeout: 5000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  })
  return { message: "Pre-consultation note created successfully", data: undefined }
})

export type GetPreAssessmentNotes = Awaited<ReturnType<typeof getPreAssessmentNotesAction>>
export const getPreAssessmentNotesAction = withErrorHandling(async (appointmentId: number) => {
  
  const session = await getCachedSession()
  if(!session) throw new Error("User not authenticated.")

  const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "CLINIC"})
  const readPreAssessmentNotePermissions = [PERMISSIONS.CLINIC["READ:CLINIC:PRE_ASSESSMENT_NOTE"].name]
  const myPermissionArray = myPermissions.map(permission => permission.name)
  const canReadPermission = readPreAssessmentNotePermissions.every(permission => myPermissionArray.includes(permission))

  if(!canReadPermission) throw new Error("You do not have permission to read pre-assessment note.")

  const preAssessmentNote = await prisma.preAssessmentNote.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      appointmentId
    },
    include: {
      CreatedBy: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true
        }
      }
    }
  })
  return { message: "Pre-consultation note fetched successfully",  data: preAssessmentNote }
})