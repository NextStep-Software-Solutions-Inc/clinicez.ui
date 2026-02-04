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
  cursor?: number
  distinct?: Prisma.ClinicPatientScalarFieldEnum[]
  userId?: string
  gender?: string
  minAge?: number
  maxAge?: number
}
export interface GetClinicPatientsResult {
  message: string;
  data: Array<{
    stats: { appointments: number; conditions: number; medications: number };
    id: number;
    Clinic: {
      id: number;
      name: string;
    };
    Patient: {
      id: number;
      userId: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffix: string | null;
      email: string;
      dob: Date | null;
      gender: string | null;
      updatedAt: Date;
      bloodType: string | null;
      nickname: string | null;
      picture: string | null;
      StudentRecords: Array<{ studentId: number }>;
    };
  }>;
  total: number;
  nextCursor: number | null;
  hasMore: boolean;
}

export type GetClinicPatients = GetClinicPatientsResult;
export const getClinicPatientsAction = async (filters: GetClinicPatientFilters): Promise<GetClinicPatientsResult> => {


  const session = await getCachedSession()
  if (!session) throw new Error("Unauthorized")
  const { search, cursor, pageSize = 50, distinct = [], clinicUid, userId, gender, minAge = 0, maxAge = 120 } = filters ?? {}

  // Calculate birth date range based on age
  // minAge (e.g., 20) = oldest person we want (born 20+ years ago, smaller date)
  // maxAge (e.g., 30) = youngest person we want (born 30- years ago, larger date)
  const now = new Date();
  const minBirthDate = minAge !== undefined ? new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate()) : undefined;
  const maxBirthDate = maxAge !== undefined ? new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate()) : undefined;

  const clinicPatients = await prismaClient.clinicPatient.findMany({
    take: pageSize + 1, // Fetch one extra to know if there's a next page
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    ...!!distinct.length ? { distinct } : {},
    orderBy: {
      createdAt: "desc"
    },
    where: {
      Clinic: {
        clinicUid
      },
      Patient: {
        ...userId ? { userId } : {},
        ...(gender && gender !== 'all') ? { gender: gender as 'MALE' | 'FEMALE' } : {},
        ...(minAge !== undefined || maxAge !== undefined) ? {
          dob: {
            ...(minBirthDate && { lte: minBirthDate }),
            ...(maxBirthDate && { gte: maxBirthDate }),
          }
        } : {},
        ...!!search ? {
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

  // Check if there's a next page
  const hasMore = clinicPatients.length > pageSize;
  const data = hasMore ? clinicPatients.slice(0, -1) : clinicPatients;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  // Get all patient IDs
  const patientIds = data.map(cp => cp.Patient?.id).filter(Boolean) as number[];
  const clinicId = data[0]?.Clinic?.id;

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
  const clinicPatientsWithStats = data.map(clinicPatient => ({
    ...clinicPatient,
    stats: {
      appointments: appointmentCounts[clinicPatient.Patient?.id] || 0,
      conditions: conditionCounts[clinicPatient.Patient?.id] || 0,
      medications: medicationCounts[clinicPatient.Patient?.id] || 0,
    },
  }));

  // Calculate total count of patients matching the filters
  const totalCount = await prismaClient.clinicPatient.count({
    where: {
      Clinic: {
        clinicUid
      },
      Patient: {
        ...userId ? { userId } : {},
        ...(gender && gender !== 'all') ? { gender: gender as 'MALE' | 'FEMALE' } : {},
        ...(minAge !== undefined || maxAge !== undefined) ? {
          dob: {
            ...(minBirthDate && { lte: minBirthDate }),
            ...(maxBirthDate && { gte: maxBirthDate }),
          }
        } : {},
        ...!!search ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { middleName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        } : {},
      }
    }
  });

  return { message: "Clinic Patients fetched successfully", data: clinicPatientsWithStats, total: totalCount, nextCursor, hasMore } as unknown as GetClinicPatientsResult
}


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


