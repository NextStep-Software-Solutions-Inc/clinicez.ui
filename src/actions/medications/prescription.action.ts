"use server";
import "server-only";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";


export type GetPrescriptionsFilter = {
    clinicUid?: string,
    hpId?: number,
    isArchived?: boolean
}
export type GetPrescriptions = Awaited<ReturnType<typeof getPrescriptionsActions>>
export const getPrescriptionsActions = withErrorHandling(async (filters?: GetPrescriptionsFilter) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const { clinicUid, hpId, isArchived } = filters || {}
    
  const prescriptions = await prisma.prescription.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      hpId,
      Clinic: {
        clinicUid
      },
      isArchived
    },
    include: {
      Medication: {
        select: {
          completedAt: true,
          patientId: true,
          _count: {
            select: {
              MedicationDrugs: true
            }
          }
        }
      }
    }
  })
  return {message: "Successfully fetched prescriptions", data: prescriptions}

})

type CreatePrescriptionPayload = {
  templateId?: number,
  medicationId: number,
  name?: string,
  hpId: number,
  clinicUid: string,
}
export const createPrescriptionAction = withErrorHandling(async (payload: CreatePrescriptionPayload) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  const {clinicUid, templateId, name, hpId, medicationId } = payload
  
  const defaultTemplate = 2

  const template = templateId ?? defaultTemplate
  await prisma.prescription.create({
    data: {
      name,
      HealthcareProvider: {
        connect: {
          id: hpId
        }
      },
      Medication: {
        connect: {
          id: medicationId
        }
      },
      DocumentTemplate: {
        connect: {
          id: template
        }
      },
      Clinic: {
        connect: {
          clinicUid
        }
      },
    }
  })

  return { message: "Successfully created prescription", data: undefined }

})

export const updatePrescriptionActions = withErrorHandling(async (payload: {id: number, name?: string}) => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  const {id, name} = payload
  await prisma.prescription.update({
    where: {id},
    data: {name}
  })

  return { message: "Successfully updated prescription", data: undefined}

})