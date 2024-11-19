"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";


type GetClinicPatientFilters = {
  search?: string
  clinicUid: string
  pageSize?: number
  pageNumber?: number
  distinct?: boolean
}
export type GetClinicPatients = Awaited<ReturnType<typeof getClinicPatientsAction>>
export const getClinicPatientsAction = withErrorHandling(async (filter: GetClinicPatientFilters) => {

 
  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")
  const { search, pageNumber = 1, pageSize = 50, distinct = false, clinicUid } = filter ?? {}
  
  const clinicPatients = await prismaClient.clinicPatient.findMany({
    ... pageSize ? { take: pageSize } : {},
    ... distinct ? { distinct: ["clinicId"]} : {},
    skip: pageNumber ? (pageNumber - 1) * (pageSize || 10) : 0,
    orderBy: {
      createdAt: "desc"
    },
    where: {
      Clinic: {
        clinicUid
      },
      Patient: {
        ... !!search ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { middleName: { contains: search, mode: "insensitive"} },
            { lastName: { contains: search, mode: "insensitive"} },
            { email: { contains: search, mode: "insensitive"} },
          ]
        }: {},
      }
    },
    select: {
      id: true,
      Clinic: {
        select: {
          id: true,
          name: true
        }
      },
      Patient: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          dob: true,
          gender: true,
          updatedAt: true,
          bloodType: true,
          nickname: true,
          picture: true,
        }
      }
    }
  })

  return {message: "Clinic Patients fetched successfully", data: clinicPatients}
})