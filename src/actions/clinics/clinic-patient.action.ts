"use server";

import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { $Enums, Prisma } from "@prisma/client";
import { sessionCheck } from "@/lib/auth";
import {
  requireClinicPermission,
  requirePermissionOrOwnership,
} from "@/lib/permission-checker";
import { PERMISSIONS } from "@/lib/permissions";
import prismaClient from "@/lib/prisma";
import { hasCodeProperty } from "@/lib/utils";
import { withErrorHandling } from "@/lib/with-error-handling";
import { generateUniqueUsername } from "@/utils/username.utils";
import { getCachedSession } from "../session.action";
export const getClinicPatientAction = withErrorHandling(
  async ({ userId, clinicUid }: { userId: number; clinicUid: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    // Fetch the user to get their userId for permission check
    const targetUser = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { userId: true },
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
      "view patient record",
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
  },
);

export type GetClinicPatientFilters = {
  search?: string;
  clinicUid: string;
  pageSize?: number;
  cursor?: number;
  distinct?: Prisma.ClinicPatientScalarFieldEnum[];
  userId?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
};
export interface GetClinicPatientsResult {
  message: string;
  data: Array<{
    stats: {
      appointments: number;
      conditions: number;
      medications: number;
      activeMedications: number;
    };
    id: number;
    createdAt: Date;
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

/** Build a Prisma OR filter array for patient name/email search, supporting multi-word full-name queries. */
function buildPatientSearchFilter(search: string) {
  return {
    OR: [
      { firstName: { contains: search, mode: "insensitive" as const } },
      { middleName: { contains: search, mode: "insensitive" as const } },
      { lastName: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
      // Multi-word full-name search: each word must match at least one name field
      ...(search.includes(" ")
        ? [
          {
            AND: search
              .split(/\s+/)
              .filter(Boolean)
              .map((part) => ({
                OR: [
                  {
                    firstName: {
                      contains: part,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    middleName: {
                      contains: part,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: part,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              })),
          },
        ]
        : []),
    ],
  };
}

const DEFAULT_MIN_AGE = 0;
const DEFAULT_MAX_AGE = 120;

export const getClinicPatientsAction = async (
  filters: GetClinicPatientFilters,
): Promise<GetClinicPatientsResult> => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  // Check permission: user must have permission to view all patients in the clinic
  await requireClinicPermission(
    session.user.sub,
    filters.clinicUid,
    PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:ALL"].name,
    "view patient list",
  );

  const {
    search,
    cursor,
    pageSize = 50,
    distinct = [],
    clinicUid,
    userId,
    gender,
    minAge = DEFAULT_MIN_AGE,
    maxAge = DEFAULT_MAX_AGE,
  } = filters ?? {};

  // Calculate birth date range based on age
  // minAge (e.g., 20) = oldest person we want (born 20+ years ago, smaller date)
  // maxAge (e.g., 30) = youngest person we want (born 30- years ago, larger date)
  const now = new Date();
  const minBirthDate =
    minAge !== undefined
      ? new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate())
      : undefined;
  const maxBirthDate =
    maxAge !== undefined
      ? new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate())
      : undefined;

  const clinicPatients = await prismaClient.clinicPatient.findMany({
    take: pageSize + 1, // Fetch one extra to know if there's a next page
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    ...(distinct.length ? { distinct } : {}),
    orderBy: {
      createdAt: "desc",
    },
    where: {
      Clinic: {
        clinicUid,
      },
      Patient: {
        ...(userId ? { userId } : {}),
        ...(gender && gender !== "all"
          ? { gender: gender as "MALE" | "FEMALE" }
          : {}),
        AND: [
          // Only apply the DOB filter when the age range has been explicitly changed from defaults.
          // When both are at defaults (0–120), skip filtering so all patients (including those
          // with extreme or erroneous DOB values) are included.
          ...(minAge > DEFAULT_MIN_AGE || maxAge < DEFAULT_MAX_AGE
            ? [
              {
                OR: [
                  { dob: null },
                  {
                    dob: {
                      ...(minBirthDate && { lte: minBirthDate }),
                      ...(maxBirthDate && { gte: maxBirthDate }),
                    },
                  },
                ],
              },
            ]
            : []),
          // Search filter
          ...(search ? [buildPatientSearchFilter(search)] : []),
        ],
      },
    },
    select: {
      id: true,
      createdAt: true,
      profileCompletionStatus: true,
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
          StudentRecords: {
            where: {
              isActive: true,
            },
            select: {
              studentId: true,
            },
          },
        },
      },
    },
  });

  // Check if there's a next page
  const hasMore = clinicPatients.length > pageSize;
  const data = hasMore ? clinicPatients.slice(0, -1) : clinicPatients;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  // Get all patient IDs
  const patientIds = data
    .map((cp) => cp.Patient?.id)
    .filter(Boolean) as number[];
  const clinicPatientIds = data.map((cp) => cp.id);
  const clinicId = data[0]?.Clinic?.id;

  // Batch queries for all stats at once
  const [
    appointments,
    conditions,
    medications,
    activeMedications,
    prescriptionMedicines,
    activePrescriptionMedicines,
  ] = await Promise.all([
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
        status: "UNRESOLVED",
      },
      select: { userId: true },
    }),
    prismaClient.medication.findMany({
      where: {
        patientId: { in: patientIds },
      },
      select: { patientId: true },
    }),
    // Legacy Medication model: count only active ones (completedAt = null means not yet completed).
    prismaClient.medication.findMany({
      where: {
        patientId: { in: patientIds },
        completedAt: null,
      },
      select: { patientId: true },
    }),
    // Count all medicines from the Prescription (Rx) system, keyed by ClinicPatient.id.
    // Include consumed/inactive medicines so the count never decreases after a medicine is consumed.
    prismaClient.medicine.findMany({
      where: {
        Prescription: {
          patientId: { in: clinicPatientIds },
        },
      },
      select: {
        Prescription: {
          select: { patientId: true },
        },
      },
    }),
    // Count only currently active medicines (isActive = true, not soft-deleted).
    prismaClient.medicine.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        Prescription: {
          patientId: { in: clinicPatientIds },
        },
      },
      select: {
        Prescription: {
          select: { patientId: true },
        },
      },
    }),
  ]);

  // Build a lookup: ClinicPatient.id → Patient (User) id
  const clinicPatientToPatientId = data.reduce(
    (acc, cp) => {
      if (cp.Patient?.id) acc[cp.id] = cp.Patient.id;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Aggregate counts by patient ID
  const appointmentCounts = appointments.reduce(
    (acc, app) => {
      acc[app.userId] = (acc[app.userId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const conditionCounts = conditions.reduce(
    (acc, cond) => {
      acc[cond.userId] = (acc[cond.userId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Old Medication model counts (patientId = User.id)
  const medicationCounts = medications.reduce(
    (acc, med) => {
      acc[med.patientId] = (acc[med.patientId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Active legacy Medication counts (completedAt = null)
  const activeMedicationCounts = activeMedications.reduce(
    (acc, med) => {
      acc[med.patientId] = (acc[med.patientId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  // New Prescription/Medicine counts (Prescription.patientId = ClinicPatient.id)
  const prescriptionMedicineCounts = prescriptionMedicines.reduce(
    (acc, med) => {
      const clinicPatientId = med.Prescription?.patientId;
      if (clinicPatientId !== undefined) {
        const patientId = clinicPatientToPatientId[clinicPatientId];
        if (patientId) acc[patientId] = (acc[patientId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>,
  );

  // Active Prescription/Medicine counts (isActive = true, deletedAt = null)
  const activePrescriptionMedicineCounts = activePrescriptionMedicines.reduce(
    (acc, med) => {
      const clinicPatientId = med.Prescription?.patientId;
      if (clinicPatientId !== undefined) {
        const patientId = clinicPatientToPatientId[clinicPatientId];
        if (patientId) acc[patientId] = (acc[patientId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>,
  );

  // Attach stats to each patient
  const clinicPatientsWithStats = data.map((clinicPatient) => ({
    ...clinicPatient,
    stats: {
      appointments: appointmentCounts[clinicPatient.Patient?.id] || 0,
      conditions: conditionCounts[clinicPatient.Patient?.id] || 0,
      medications:
        (medicationCounts[clinicPatient.Patient?.id] || 0) +
        (prescriptionMedicineCounts[clinicPatient.Patient?.id] || 0),
      activeMedications:
        (activeMedicationCounts[clinicPatient.Patient?.id] || 0) +
        (activePrescriptionMedicineCounts[clinicPatient.Patient?.id] || 0),
    },
  }));

  // Calculate total count of patients matching the filters
  const totalCount = await prismaClient.clinicPatient.count({
    where: {
      Clinic: {
        clinicUid,
      },
      Patient: {
        ...(userId ? { userId } : {}),
        ...(gender && gender !== "all"
          ? { gender: gender as "MALE" | "FEMALE" }
          : {}),
        AND: [
          // Only apply the DOB filter when the age range has been explicitly changed from defaults.
          // When both are at defaults (0–120), skip filtering so all patients (including those
          // with extreme or erroneous DOB values) are included.
          ...(minAge > DEFAULT_MIN_AGE || maxAge < DEFAULT_MAX_AGE
            ? [
              {
                OR: [
                  { dob: null },
                  {
                    dob: {
                      ...(minBirthDate && { lte: minBirthDate }),
                      ...(maxBirthDate && { gte: maxBirthDate }),
                    },
                  },
                ],
              },
            ]
            : []),
          // Search filter
          ...(search ? [buildPatientSearchFilter(search)] : []),
        ],
      },
    },
  });

  return {
    message: "Clinic Patients fetched successfully",
    data: clinicPatientsWithStats,
    total: totalCount,
    nextCursor,
    hasMore,
  } as unknown as GetClinicPatientsResult;
};

export const addClinicPatientAction = withErrorHandling(
  async ({ clinicUid, userId }: { clinicUid: string; userId: string }) => {
    const session = await sessionCheck();

    // Check permission: user must have permission to create patients in the clinic
    await requireClinicPermission(
      session.user.sub,
      clinicUid,
      PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
      "add patient to clinic",
    );

    try {
      await prismaClient.$transaction(async (prisma) => {
        const patientRole = await prisma.clinicRole.findFirstOrThrow({
          where: {
            name: {
              equals: "Patient",
              mode: "insensitive",
            },
          },
        });
        const rolePermissions =
          await prisma.clinicRoleInitialPermission.findMany({
            where: {
              Clinic: {
                clinicUid,
              },
              clinicRoleId: patientRole.id,
            },
          });
        await prisma.clinicPatient.create({
          data: {
            Clinic: {
              connect: {
                clinicUid,
              },
            },
            Patient: {
              connect: {
                userId,
              },
            },
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

      return { message: "Clinic Patient added successfully", data: null };
    } catch (error) {
      if (hasCodeProperty(error) && error.code === "P2002") {
        throw new Error("Clinic Patient already exists");
      }
      throw new Error("An error occurred while adding the clinic patient.");
    }
  },
);

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

export const searchNonClinicPatientsAction = withErrorHandling(
  async ({ clinicUid, search }: { clinicUid: string; search: string }) => {
    const session = await sessionCheck();

    await requireClinicPermission(
      session.user.sub,
      clinicUid,
      PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
      "add patient to clinic",
    );

    if (!search.trim()) {
      return {
        message: "No search query",
        data: [] as SearchNonClinicPatientsResult[],
      };
    }

    // Find users who are NOT already patients of this clinic
    const users = await prismaClient.user.findMany({
      take: 10,
      where: {
        isActive: true,
        ...buildPatientSearchFilter(search.trim()),
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
  },
);

// ── Create and add clinic patient ─────────────────────────────────────────────

export type CreateAndAddClinicPatientPayload = {
  clinicUid: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: $Enums.Gender;
  dob?: Date;
};

export const createAndAddClinicPatientAction = withErrorHandling(
  async (payload: CreateAndAddClinicPatientPayload) => {
    const session = await sessionCheck();

    await requireClinicPermission(
      session.user.sub,
      payload.clinicUid,
      PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
      "add patient to clinic",
    );

    const { clinicUid, firstName, lastName, email, gender, dob } = payload;

    // Check email is not already in use
    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error(
        "This email address is already registered. Please search for the user instead.",
      );
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
            gender,
          },
          select: {
            id: true,
            userId: true,
          },
        });

        // Assign default user permissions
        const userPermissions = await prisma.permission.findMany({
          where: { isActive: true, type: "USER", name: { not: "SUPER_ADMIN" } },
          select: { id: true },
        });
        if (userPermissions.length > 0) {
          await prisma.userPermission.createMany({
            skipDuplicates: true,
            data: userPermissions.map((p) => ({
              permissionId: p.id,
              userId: newUser.id,
            })),
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
      if (
        clerkMessage.toLowerCase().includes("already") ||
        clerkMessage.toLowerCase().includes("taken") ||
        clerkMessage.toLowerCase().includes("exist")
      ) {
        throw new Error(
          "This email address is already registered in the authentication system.",
        );
      }
      throw new Error(`Failed to create user account: ${clerkMessage}`);
    }
    return {
      message: "Patient created and added to clinic successfully",
      data: null,
    };
  },
);

// ── Self-enrollment helpers (patient-facing, V2 dashboard) ────────────────────

/**
 * Checks whether the currently authenticated user is already a patient at a
 * given clinic.  Lightweight – returns a boolean so callers can decide
 * whether to show the consent dialog before booking.
 */
export async function checkIsClinicPatientAction(
  clinicUid: string,
): Promise<boolean> {
  const session = await getCachedSession();
  if (!session) return false;

  const record = await prismaClient.clinicPatient.findFirst({
    where: {
      Clinic: { clinicUid },
      Patient: { userId: session.user.sub },
    },
    select: { id: true },
  });

  return record !== null;
}

/**
 * Allows the currently authenticated user to self-enroll as a patient at a
 * clinic.  Enrollment is permitted when EITHER of the following is true:
 *   1. The user is an active member of an organization linked to this clinic.
 *   2. The clinic is publicly accessible (ClinicSetting.isPublic = true).
 *
 * Does NOT require the staff-level CREATE:CLINIC:PATIENT permission.
 */
export const selfEnrollAsClinicPatientAction = withErrorHandling(
  async ({ clinicUid }: { clinicUid: string }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const userId = session.user.sub;

    // Check if the clinic is public or if the user is an active org member of a linked org
    const [clinic, linkedMembership] = await Promise.all([
      prismaClient.clinic.findFirst({
        where: { clinicUid, isActive: true },
        select: { ClinicSetting: { select: { isPublic: true } } },
      }),
      prismaClient.organizationMember.findFirst({
        where: {
          User: { userId },
          status: "ACTIVE",
          Organization: {
            ClinicOrganizations: {
              some: {
                isActive: true,
                deletedAt: null,
                Clinic: { clinicUid },
              },
            },
          },
        },
        select: { id: true },
      }),
    ]);

    if (!clinic) {
      throw new Error("Clinic not found.");
    }

    const isPublicClinic = clinic.ClinicSetting?.isPublic === true;

    if (!isPublicClinic && !linkedMembership) {
      throw new Error(
        "You must either be an active member of an organization linked to this clinic, or the clinic must be publicly accessible.",
      );
    }

    try {
      await prismaClient.$transaction(async (prisma) => {
        const patientRole = await prisma.clinicRole.findFirstOrThrow({
          where: { name: { equals: "Patient", mode: "insensitive" } },
        });

        const rolePermissions =
          await prisma.clinicRoleInitialPermission.findMany({
            where: {
              Clinic: { clinicUid },
              clinicRoleId: patientRole.id,
            },
          });

        await prisma.clinicPatient.create({
          data: {
            Clinic: { connect: { clinicUid } },
            Patient: { connect: { userId } },
            ClinicPatientPermissions: {
              createMany: {
                data: rolePermissions.map((p) => ({
                  permissionId: p.permissionId,
                })),
              },
            },
          },
        });
      });
    } catch (error) {
      if (hasCodeProperty(error) && error.code === "P2002") {
        // Already a patient – treat as success so the booking can proceed
        return { message: "Already enrolled as a clinic patient", data: null };
      }
      throw new Error(
        "An error occurred while enrolling you as a clinic patient.",
      );
    }

    return { message: "Successfully enrolled as a clinic patient", data: null };
  },
);
