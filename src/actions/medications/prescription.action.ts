"use server";
import "server-only";
import prismaTenant from "@lib/prisma-tenant";
import { getCachedSession } from "@actions/session.action";


export type GetPrescriptionsFilter = {
    clinicId?: number,
    hpId?: number,
    isArchived?: boolean
}
export type GetPrescriptions = Awaited<ReturnType<typeof getPrescriptionsActions>>
export const getPrescriptionsActions = async (filters?: GetPrescriptionsFilter) => {
  let message = "Successfully fetched prescriptions";
  try {
    const session = await getCachedSession()
    if(!session) throw new Error("Unauthorized")

    const { clinicId, hpId, isArchived } = filters || {}
    
    const prescriptions = await prismaTenant.prescription.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        hpId,
        clinicId,
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
    return {status: true, message, data: prescriptions}
  } catch (error) {
    console.error(`Error while fetching prescriptions: ${error}`);
    if(error instanceof Error) message = error.message
    return { status: true, message, data: []}
  }
}

type CreatePrescriptionPayload = {
  templateId?: number,
  medicationId: number,
  name?: string,
  hpId: number,
  clinicId: number,
}
export const createPrescriptionActions = async (payload: CreatePrescriptionPayload) => {
  let message = "Successfully created prescription";
  try {
    const session = await getCachedSession()
    if(!session) throw new Error("Unauthorized")
    const {clinicId, templateId, name, hpId, medicationId } = payload
  
    const defaultTemplate = 2

    const template = templateId ?? defaultTemplate
    await prismaTenant.prescription.create({
      data: {
        templateId: template,
        medicationId,
        name,
        hpId,
        clinicId,
      }
    })

    return {status: true, message}
  } catch (error) {
    message = "Failed to create prescription"
    console.error(`Error while creating prescription: ${error}`);
    if(error instanceof Error) message = error.message
    return { status: false, message}
  }
}

export const updatePrescriptionActions = async (payload: {id: number, name?: string}) => {
  let message = "Successfully updated prescription";
  try {
    const session = await getCachedSession()
    if(!session) throw new Error("Unauthorized")
    const {id, name} = payload
    await prismaTenant.prescription.update({
      where: {id},
      data: {name}
    })

    return {status: true, message}
  } catch (error) {
    message = "Failed to update prescription"
    console.error(`Error while updating prescription: ${error}`);
    if(error instanceof Error) message = error.message
    return { status: false, message}
  }
}