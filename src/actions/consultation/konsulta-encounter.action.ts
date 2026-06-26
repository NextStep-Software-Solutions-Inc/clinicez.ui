"use server";

import prismaClient from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

// ─── Toggle PhilHealth Konsulta on a consultation ticket ──────────────────────

export const togglePhilHealthKonsultaAction = withErrorHandling(
  async ({
    ticketId,
    enabled,
  }: {
    ticketId: number;
    enabled: boolean;
  }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const ticket = await prismaClient.consultationTicket.update({
      where: { id: ticketId },
      data: { isPhilHealthKonsulta: enabled },
      select: {
        id: true,
        isPhilHealthKonsulta: true,
        konsultaAtcCode: true,
        konsultaIsWalkedIn: true,
        konsultaCoPay: true,
      },
    });

    return {
      data: ticket,
      message: enabled
        ? "PhilHealth Konsulta enabled"
        : "PhilHealth Konsulta disabled",
    };
  }
);

// ─── Update Konsulta encounter fields (ATC, Walk-in, Co-Pay) ─────────────────

export const updateKonsultaEncounterAction = withErrorHandling(
  async ({
    ticketId,
    atcCode,
    isWalkedIn,
    coPay,
  }: {
    ticketId: number;
    atcCode?: string | null;
    isWalkedIn?: boolean | null;
    coPay?: number | null;
  }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    // If walk-in is toggled ON, auto-set ATC to "WALKEDIN"
    const resolvedAtcCode =
      isWalkedIn === true ? "WALKEDIN" : (atcCode ?? undefined);

    const ticket = await prismaClient.consultationTicket.update({
      where: { id: ticketId },
      data: {
        ...(resolvedAtcCode !== undefined && {
          konsultaAtcCode: resolvedAtcCode,
        }),
        ...(isWalkedIn !== undefined && {
          konsultaIsWalkedIn: isWalkedIn,
        }),
        ...(coPay !== undefined && {
          konsultaCoPay: coPay,
        }),
      },
      select: {
        id: true,
        isPhilHealthKonsulta: true,
        konsultaAtcCode: true,
        konsultaIsWalkedIn: true,
        konsultaCoPay: true,
      },
    });

    return { data: ticket, message: "Konsulta encounter updated" };
  }
);

// ─── Check profiling completeness for a patient ──────────────────────────────

export interface ProfilingCompletenessResult {
  isComplete: boolean;
  missing: string[];
  present: string[];
}

export const checkProfilingCompletenessAction = withErrorHandling(
  async ({ clinicPatientId }: { clinicPatientId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const clinicPatient = await prismaClient.clinicPatient.findUnique({
      where: { id: clinicPatientId },
      select: {
        Patient: {
          select: {
            id: true,
            gender: true,
            bloodType: true,
            MedicalHistories: { take: 1, select: { id: true } },
            FamilyMedicalHistories: { take: 1, select: { id: true } },
            PersonalHistory: { select: { id: true } },
            ObGyneHistory: { select: { id: true } },
            VitalSigns: {
              where: { isActive: true, deletedAt: null },
              take: 1,
              orderBy: { createdAt: "desc" as const },
              select: {
                id: true,
                bpSystolic: true,
                height: true,
                weight: true,
              },
            },
          },
        },
      },
    });

    if (!clinicPatient?.Patient) {
      throw new Error("Patient not found");
    }

    const patient = clinicPatient.Patient;
    const missing: string[] = [];
    const present: string[] = [];

    // Check medical history
    if (patient.MedicalHistories.length > 0) {
      present.push("Medical History");
    } else {
      missing.push("Medical History");
    }

    // Check family history
    if (patient.FamilyMedicalHistories.length > 0) {
      present.push("Family History");
    } else {
      missing.push("Family History");
    }

    // Check personal/social history
    if (patient.PersonalHistory) {
      present.push("Social History");
    } else {
      missing.push("Social History");
    }

    // Check blood type
    if (patient.bloodType) {
      present.push("Blood Type");
    } else {
      missing.push("Blood Type");
    }

    // Check vitals (PEPERT)
    const latestVitals = patient.VitalSigns[0];
    if (latestVitals && (latestVitals.bpSystolic || latestVitals.height || latestVitals.weight)) {
      present.push("Profile Vitals");
    } else {
      missing.push("Profile Vitals");
    }

    // Check OB-Gyne history for female patients
    if (patient.gender === "FEMALE") {
      if (patient.ObGyneHistory) {
        present.push("Menstrual/Pregnancy History");
      } else {
        missing.push("Menstrual/Pregnancy History");
      }
    }

    return {
      data: {
        isComplete: missing.length === 0,
        missing,
        present,
      } satisfies ProfilingCompletenessResult,
      message: missing.length === 0
        ? "Patient profile is complete for PhilHealth Konsulta"
        : `Missing ${missing.length} required section(s)`,
    };
  }
);
