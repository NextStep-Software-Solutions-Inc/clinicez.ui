"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";
import { sessionCheck } from "@/lib/auth";
import { hasCodeProperty } from "@/lib/utils";
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
          StudentRecords: {
            where: {
              isActive: true
            },
            select: {
              studentId: true
            }
          }
        }
      }
    }
  })

  // Get all patient IDs
  const patientIds = clinicPatients.map(cp => cp.Patient?.id).filter(Boolean) as number[];
  const clinicId = clinicPatients[0]?.Clinic?.id;

  // Batch queries for all stats at once
  const [appointments, conditions, medications] = await Promise.all([
    prismaClient.appointmentRequester.findMany({
      where: {
        userId: { in: patientIds },
        ...(clinicId && {
          Appointment: { clinicId },
        }),
      },
      select: { userId: true },
    }),
    prismaClient.userHealthCondition.findMany({
      where: {
        userId: { in: patientIds },
        status: 'UNRESOLVED',
      },
      select: { userId: true },
    }),
    prismaClient.medication.findMany({
      where: {
        patientId: { in: patientIds },
      },
      select: { patientId: true },
    }),
  ]);

  // Aggregate counts by patient ID
  const appointmentCounts = appointments.reduce((acc, app) => {
    acc[app.userId] = (acc[app.userId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const conditionCounts = conditions.reduce((acc, cond) => {
    acc[cond.userId] = (acc[cond.userId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const medicationCounts = medications.reduce((acc, med) => {
    acc[med.patientId] = (acc[med.patientId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Attach stats to each patient
  const clinicPatientsWithStats = clinicPatients.map(clinicPatient => ({
    ...clinicPatient,
    stats: {
      appointments: appointmentCounts[clinicPatient.Patient?.id] || 0,
      conditions: conditionCounts[clinicPatient.Patient?.id] || 0,
      medications: medicationCounts[clinicPatient.Patient?.id] || 0,
    },
  }));

  return { message: "Clinic Patients fetched successfully", data: clinicPatientsWithStats }
})


export const addClinicPatientAction = withErrorHandling(async ({ clinicUid, userId }: { clinicUid: string, userId: string }) => {
  await sessionCheck()

  try {
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
  } catch (error) {
    if (hasCodeProperty(error) && error.code === "P2002") {
      throw new Error("Clinic Patient already exists")
    }
    throw new Error("An error occurred while adding the clinic patient.")
  }
})


