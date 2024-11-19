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
export type GetPrescriptions = Awaited<ReturnType<typeof getPrescriptionsAction>>
export const getPrescriptionsAction = withErrorHandling(async (filters?: GetPrescriptionsFilter) => {

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
          Patient: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true
            }
          },
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
  
  const template = templateId ? templateId : (await getClinicPrescriptionSetting(clinicUid))?.prescriptionTemplateId
  
  if(!template) throw new Error("No prescription template found")

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

const getClinicPrescriptionSetting = async (clinicUid: string) => {
  return await prisma.clinicPrescriptionSetting.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    }
  })
}

export type GetPrescription = Awaited<ReturnType<typeof getPrescriptionAction>>
export const getPrescriptionAction = withErrorHandling(async (id: number) => {
  
  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  
  const prescription = await prisma.prescription.findUnique({
    where: {id},
    include: {
      DocumentTemplate: {
        select: {
          id: true,
          name: true,
          htmlContent: true
        }
      },
      Medication: {
        select: {
          completedAt: true,
          Patient: {
            select: {
              userId: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true
            }
          },
          _count: {
            select: {
              MedicationDrugs: true
            }
          }
        }
      }
    }
  })
  return {message: "Successfully fetched prescription", data: prescription}
})