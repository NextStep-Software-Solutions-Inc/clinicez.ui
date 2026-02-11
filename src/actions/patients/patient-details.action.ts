"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "../audit.action";

/**
 * Get comprehensive patient details including profile, health records, and related data
 */
export async function getPatientDetails(params: {
  patientId: number;
  clinicId: number;
  userId: number;
}) {
  const { patientId, clinicId, userId } = params;

  try {
    // Fetch patient with all related data
    const clinicPatient = await prisma.clinicPatient.findFirst({
      where: {
        id: patientId,
        clinicId: clinicId,
      },
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            nickname: true,
            email: true,
            mobile: true,
            telephone: true,
            dob: true,
            gender: true,
            placeOfBirth: true,
            civilStatus: true,
            bloodType: true,
            religion: true,
            nationality: true,
            onboardingStatus: true,
            isShellAccount: true,
            shellAccountCreatedBy: true,
            profileCompletionDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!clinicPatient) {
      return {
        success: false,
        error: "Patient not found",
      };
    }

    // Log the view action
    await createAuditLog({
      actorId: userId,
      actionType: "VIEW",
      entityType: "CLINIC_PATIENT",
      entityId: patientId,
      metadata: {
        clinicId,
        patientName: clinicPatient.Patient ? `${clinicPatient.Patient.firstName} ${clinicPatient.Patient.lastName}` : "Unknown",
      },
    });

    return {
      success: true,
      data: clinicPatient,
    };
  } catch (error) {
    console.error("Error fetching patient details:", error);
    return {
      success: false,
      error: "Failed to fetch patient details",
    };
  }
}

/**
 * Update patient profile information
 */
export async function updatePatientProfile(params: {
  patientId: number;
  clinicId: number;
  userId: number;
  profileData: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
    suffix?: string | null;
    nickname?: string | null;
    email?: string;
    mobile?: string;
    telephone?: string | null;
    dob?: Date;
    gender?: string;
    placeOfBirth?: string | null;
    civilStatus?: string | null;
    bloodType?: string | null;
    religion?: string | null;
    nationality?: string | null;
  };
}) {
  const { patientId, clinicId, userId, profileData } = params;

  try {
    // First get the current patient data
    const clinicPatient = await prisma.clinicPatient.findFirst({
      where: {
        id: patientId,
        clinicId: clinicId,
      },
      include: {
        Patient: true,
      },
    });

    if (!clinicPatient) {
      return {
        success: false,
        error: "Patient not found",
      };
    }

    const currentUser = clinicPatient.Patient;
    const userIdToUpdate = currentUser.id;

    // Track changes for audit log
    const changes: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    // Compare and track changes
    Object.keys(profileData).forEach((key) => {
      const fieldKey = key as keyof typeof profileData;
      const newValue = profileData[fieldKey];
      const oldValue = currentUser[fieldKey as keyof typeof currentUser];

      // Convert to strings for comparison
      const oldValueStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
      const newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : null;

      if (oldValueStr !== newValueStr) {
        changes.push({
          field: key,
          oldValue: oldValueStr,
          newValue: newValueStr,
        });
      }
    });

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: {
        firstName: profileData.firstName,
        middleName: profileData.middleName,
        lastName: profileData.lastName,
        suffix: profileData.suffix,
        nickname: profileData.nickname,
        email: profileData.email,
        mobile: profileData.mobile,
        telephone: profileData.telephone,
        dob: profileData.dob,
        gender: profileData.gender as "MALE" | "FEMALE" | null | undefined,
        placeOfBirth: profileData.placeOfBirth,
        civilStatus: profileData.civilStatus as "SINGLE" | "MARRIED" | "WIDOWED" | "DIVORCED" | "SEPARATED" | null | undefined,
        bloodType: profileData.bloodType as "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | null | undefined,
        religion: profileData.religion,
        nationality: profileData.nationality,
      },
    });

    // Log all changes in audit trail
    if (changes.length > 0) {
      await Promise.all(
        changes.map((change) =>
          createAuditLog({
            actorId: userId,
            actionType: "UPDATE",
            entityType: "CLINIC_PATIENT",
            entityId: patientId,
            metadata: {
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              clinicId,
            },
          })
        )
      );
    }

    return {
      success: true,
      data: updatedUser,
      message: "Patient profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return {
      success: false,
      error: "Failed to update patient profile",
    };
  }
}

/**
 * Update patient health records
 * Note: Health records fields need to be added to schema if not present
 */
export async function updatePatientHealthRecords(params: {
  patientId: number;
  clinicId: number;
  userId: number;
  healthRecords: {
    existingConditions?: string | null;
    knownAllergies?: string | null;
    currentMedications?: string | null;
    medicalHistory?: string | null;
  };
}) {
  const { patientId, clinicId, userId, healthRecords } = params;

  try {
    // Fetch current patient
    const clinicPatient = await prisma.clinicPatient.findFirst({
      where: {
        id: patientId,
        clinicId: clinicId,
      },
      include: {
        Patient: true,
      },
    });

    if (!clinicPatient) {
      return {
        success: false,
        error: "Patient not found",
      };
    }

    // For now, log the health records update in audit trail
    // TODO: Add health records fields to User or create separate HealthRecord model
    await createAuditLog({
      actorId: userId,
      actionType: "UPDATE",
      entityType: "CLINIC_PATIENT",
      entityId: patientId,
      metadata: {
        action: "health_records_update",
        healthRecords,
        clinicId,
      },
    });

    return {
      success: true,
      data: healthRecords,
      message: "Health records update logged successfully",
    };
  } catch (error) {
    console.error("Error updating health records:", error);
    return {
      success: false,
      error: "Failed to update health records",
    };
  }
}

/**
 * Get patient activity timeline
 */
export async function getPatientTimeline(params: {
  patientId: number;
  clinicId: number;
  page?: number;
  perPage?: number;
}) {
  const { patientId, clinicId, page = 1, perPage = 20 } = params;

  try {
    const skip = (page - 1) * perPage;

    // Fetch audit logs for this patient
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          entityType: "CLINIC_PATIENT",
          entityId: patientId,
        },
        include: {
          Actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: perPage,
      }),
      prisma.auditLog.count({
        where: {
          entityType: "CLINIC_PATIENT",
          entityId: patientId,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching patient timeline:", error);
    return {
      success: false,
      error: "Failed to fetch patient timeline",
    };
  }
}

/**
 * Get user permissions for a specific patient
 */
export async function getPatientPermissions(params: {
  userId: number;
  clinicId: number;
}) {
  const { userId, clinicId } = params;

  try {
    // Fetch user's clinic member record with permissions
    const clinicMember = await prisma.clinicMember.findFirst({
      where: {
        userId,
        clinicId,
      },
      include: {
        Role: {
          include: {
            ClinicRoleInitialPermissions: {
              include: {
                Permission: true,
              },
            },
          },
        },
      },
    });

    if (!clinicMember) {
      return {
        success: false,
        error: "User not found in clinic",
      };
    }

    // Extract permissions
    const permissions = clinicMember.Role?.ClinicRoleInitialPermissions.map(
      (rp) => rp.Permission.name
    ) || [];

    // Check specific patient-related permissions
    const patientPermissions = {
      canViewProfile: permissions.includes("view:clinic:patient:profile"),
      canEditProfile: permissions.includes("edit:clinic:patient:profile"),
      canViewHealthRecords: permissions.includes("view:clinic:patient:health_records"),
      canEditHealthRecords: permissions.includes("edit:clinic:patient:health_records"),
      canAddHealthRecords: permissions.includes("add:clinic:patient:health_records"),
      canViewConsultations: permissions.includes("view:clinic:patient:consultations"),
      canViewAuditLog: permissions.includes("view:clinic:patient:audit_log"),
      canExportAuditLog: permissions.includes("export:clinic:patient:audit_log"),
      canGenerateReport: permissions.includes("generate:clinic:patient:report"),
    };

    return {
      success: true,
      data: {
        permissions,
        patientPermissions,
      },
    };
  } catch (error) {
    console.error("Error fetching patient permissions:", error);
    return {
      success: false,
      error: "Failed to fetch permissions",
    };
  }
}

/**
 * Generate patient report (simplified version - returns data for export)
 */
export async function generatePatientReport(params: {
  patientId: number;
  clinicId: number;
  userId: number;
  includeHealthRecords?: boolean;
  includeTimeline?: boolean;
}) {
  const { patientId, clinicId, userId, includeHealthRecords = true, includeTimeline = false } = params;

  try {
    const patientResult = await getPatientDetails({ patientId, clinicId, userId });
    
    if (!patientResult.success || !patientResult.data) {
      return {
        success: false,
        error: "Patient not found",
      };
    }

    const reportData = {
      patient: patientResult.data,
      generatedAt: new Date(),
      generatedBy: userId,
    };

    // Log report generation
    await createAuditLog({
      actorId: userId,
      actionType: "VIEW",
      entityType: "CLINIC_PATIENT",
      entityId: patientId,
      metadata: {
        action: "generate_report",
        clinicId,
        includeHealthRecords,
        includeTimeline,
      },
    });

    return {
      success: true,
      data: reportData,
      message: "Report data generated successfully",
    };
  } catch (error) {
    console.error("Error generating patient report:", error);
    return {
      success: false,
      error: "Failed to generate report",
    };
  }
}
