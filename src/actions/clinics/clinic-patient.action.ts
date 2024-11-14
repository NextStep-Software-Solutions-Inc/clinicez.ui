"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";

export type GetClinicPatients = Awaited<ReturnType<typeof getClinicPatientsAction>>
export const getClinicPatientsAction = withErrorHandling(async () => {

  const session = await getCachedSession()
  if(!session) throw new Error("Unauthorized")

  const clinicPatients = await prismaClient.clinicPatient.findMany({
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