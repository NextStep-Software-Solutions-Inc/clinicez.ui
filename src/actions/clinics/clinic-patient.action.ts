"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";
import { sessionCheck } from "@/lib/auth";
import { hasCodeProperty } from "@/lib/utils";
import { managementClient } from "@/services/auth0/management-client";
import { Prisma } from "@prisma/client";

export type GetClinicPatient = Awaited<ReturnType<typeof getClinicPatientAction>>;
export const getClinicPatientAction = withErrorHandling(async ({ userId, clinicUid }: { userId: number, clinicUid: string }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const clinicPatient = await prismaClient.clinicPatient.findFirst({
    where: {
      Clinic: { clinicUid },
      Patient: { id: userId },
    },
    select: {
      id: true,
      Clinic: {
        select: {
          id: true,
          name: true,
        },
      },
      Patient: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          email: true,
          dob: true,
          gender: true,
          updatedAt: true,
          bloodType: true,
          nickname: true,
          picture: true,
        },
      },
    },
  });
  if (!clinicPatient) throw new Error("Clinic Patient not found");
  return { message: "Clinic Patient found", data: clinicPatient };
});

export type GetClinicPatientFilters = {
  search?: string
  clinicUid: string
  pageSize?: number
  pageNumber?: number
  distinct?: Prisma.ClinicPatientScalarFieldEnum[]
  userId?: string
}
export type GetClinicPatients = Awaited<ReturnType<typeof getClinicPatientsAction>>
export const getClinicPatientsAction = withErrorHandling(async (filters: GetClinicPatientFilters) => {


  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")
  const { search, pageNumber = 1, pageSize = 50, distinct = [], clinicUid, userId } = filters ?? {}

  const clinicPatients = await prismaClient.clinicPatient.findMany({
    ...pageSize ? { take: pageSize } : {},
    ... !!distinct.length ? { distinct } : {},
    skip: pageNumber ? (pageNumber - 1) * (pageSize || 10) : 0,
    orderBy: {
      createdAt: "desc"
    },
    where: {
      Clinic: {
        clinicUid
      },
      Patient: {
        ...userId ? { userId } : {},
        ... !!search ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { middleName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        } : {},
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
          email: true,
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

  return { message: "Clinic Patients fetched successfully", data: clinicPatients }
})


export const addClinicPatientAction = withErrorHandling(async ({ clinicUid, userId }: { clinicUid: string, userId: string }) => {

  await sessionCheck()

  const auth0User = await managementClient.users.get({ id: userId })
  if (!auth0User.data.email_verified) throw new Error("User email is not verified")

  await prismaClient.$transaction(async (prisma) => {
    const patientRole = await prisma.clinicRole.findFirstOrThrow({
      where: {
        name: {
          equals: "Patient",
          mode: "insensitive"
        }
      }
    })
    const rolePermissions = await prisma.clinicRoleInitialPermission.findMany({
      where: {
        Clinic: {
          clinicUid,
        },
        clinicRoleId: patientRole.id
      }
    })
    await prisma.clinicPatient.create({
      data: {
        Clinic: {
          connect: {
            clinicUid
          }
        },
        Patient: {
          connect: {
            userId
          }
        },
        ClinicPatientPermissions: {
          createMany: {
            data: rolePermissions.map(permission => ({
              permissionId: permission.permissionId
            }))
          }
        }
      }
    })
  })

  return { message: "Clinic Patient added successfully", data: null }

}, error => {
  if (hasCodeProperty(error) && error.code === "P2002") {
    return "Clinic Patient already exists"
  }
})


