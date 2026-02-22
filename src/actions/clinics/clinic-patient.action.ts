"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "../session.action";
import { sessionCheck } from "@/lib/auth";
import { generateUniqueUsername } from "@/utils/username.utils";
import { hasCodeProperty } from "@/lib/utils";
import { Prisma, $Enums } from "@prisma/client";
import { requireClinicPermission, requirePermissionOrOwnership } from "@/lib/permission-checker";
import { PERMISSIONS } from "@/lib/permissions";
import { clerkClient } from "@clerk/nextjs/server";
export const getClinicPatientAction = withErrorHandling(async ({ userId, clinicUid }: { userId: number, clinicUid: string }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  // Fetch the user to get their userId for permission check
  const targetUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { userId: true }
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Check permission: user can view all patients or their own record
  await requirePermissionOrOwnership(
    session.user.sub,
    clinicUid,
    targetUser.userId,
    PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:ALL"].name,
    PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:OWN"].name,
    "view patient record"
  );

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
    profileCompletionStatus: string;
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

  // Check permission: user must have permission to view all patients in the clinic
  await requireClinicPermission(
    session.user.sub,
    filters.clinicUid,
    PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:ALL"].name,
    "view patient list"
  );

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
      profileCompletionStatus: true,
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
  const session = await sessionCheck()

  // Check permission: user must have permission to create patients in the clinic
  await requireClinicPermission(
    session.user.sub,
    clinicUid,
    PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
    "add patient to clinic"
  );

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


// ── Search non-clinic patients ────────────────────────────────────────────────

export type SearchNonClinicPatientsResult = {
  id: number;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  email: string;
  picture: string | null;
};

export const searchNonClinicPatientsAction = withErrorHandling(async ({
  clinicUid,
  search,
}: {
  clinicUid: string;
  search: string;
}) => {
  const session = await sessionCheck();

  await requireClinicPermission(
    session.user.sub,
    clinicUid,
    PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
    "add patient to clinic"
  );

  if (!search.trim()) {
    return { message: "No search query", data: [] as SearchNonClinicPatientsResult[] };
  }

  // Find users who are NOT already patients of this clinic
  const users = await prismaClient.user.findMany({
    take: 10,
    where: {
      isActive: true,
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { middleName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
      ClinicPatients: {
        none: {
          Clinic: { clinicUid },
        },
      },
    },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      middleName: true,
      email: true,
      picture: true,
    },
  });

  return { message: "Users found", data: users };
});


// ── Create and add clinic patient ─────────────────────────────────────────────

export type CreateAndAddClinicPatientPayload = {
  clinicUid: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: $Enums.Gender;
  dob?: Date;
};

export const createAndAddClinicPatientAction = withErrorHandling(async (
  payload: CreateAndAddClinicPatientPayload
) => {
  const session = await sessionCheck();

  await requireClinicPermission(
    session.user.sub,
    payload.clinicUid,
    PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
    "add patient to clinic"
  );

  const { clinicUid, firstName, lastName, email, gender, dob } = payload;

  // Check email is not already in use
  const existingUser = await prismaClient.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("This email address is already registered. Please search for the user instead.");
  }

  try {
    // Create user in database and add as clinic patient in a transaction
    await prismaClient.$transaction(async (prisma) => {
      // Create user in Clerk
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        skipPasswordRequirement: true,
        skipPasswordChecks: true,
        username: generateUniqueUsername(firstName, lastName),
      });

      // upsert user in our database with the same email and link to Clerk userId
      const newUser = await prisma.user.upsert({
        where: { email },
        update: {
          firstName,
          lastName,
          suffix: null,
          email,
          dob,
          gender,
          userId: clerkUser.id, // Link to Clerk userId
        },
        create: {
          userId: clerkUser.id,
          firstName,
          lastName,
          middleName: null,
          suffix: null,
          email,
          dob,
          gender
        },
        select: {
          id: true,
          userId: true,
        },
      })

      // Assign default user permissions
      const userPermissions = await prisma.permission.findMany({
        where: { isActive: true, type: "USER", name: { not: "SUPER_ADMIN" } },
        select: { id: true },
      });
      if (userPermissions.length > 0) {
        await prisma.userPermission.createMany({
          skipDuplicates: true,
          data: userPermissions.map((p) => ({ permissionId: p.id, userId: newUser.id })),
        });
      }

      // Get patient role permissions for the clinic
      const patientRole = await prisma.clinicRole.findFirst({
        where: { name: { equals: "Patient", mode: "insensitive" } },
      });
      const rolePermissions = patientRole
        ? await prisma.clinicRoleInitialPermission.findMany({
          where: { Clinic: { clinicUid }, clinicRoleId: patientRole.id },
        })
        : [];

      // Add as clinic patient
      await prisma.clinicPatient.create({
        data: {
          Clinic: { connect: { clinicUid } },
          Patient: { connect: { userId: clerkUser.id } },
          ClinicPatientPermissions: {
            createMany: {
              data: rolePermissions.map((permission) => ({
                permissionId: permission.permissionId,
              })),
            },
          },
        },
      });
    });
  } catch (err) {
    // Surface the actual Clerk error so the caller receives a meaningful message
    const clerkMessage = err instanceof Error ? err.message : String(err);
    if (clerkMessage.toLowerCase().includes("already") || clerkMessage.toLowerCase().includes("taken") || clerkMessage.toLowerCase().includes("exist")) {
      throw new Error("This email address is already registered in the authentication system.");
    }
    throw new Error(`Failed to create user account: ${clerkMessage}`);
  }
  return { message: "Patient created and added to clinic successfully", data: null };
});
