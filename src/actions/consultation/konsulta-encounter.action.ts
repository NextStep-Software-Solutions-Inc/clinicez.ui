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
        ? "PhilHealth Yakap enabled"
        : "PhilHealth Yakap disabled",
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

    return { data: ticket, message: "Yakap encounter updated" };
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
        ? "Patient profile is complete for PhilHealth Yakap"
        : `Missing ${missing.length} required section(s)`,
    };
  }
);

// ─── Verify ATC Code for a Consultation Ticket ──────────────────────────────

export const verifyKonsultaEncounterAtcAction = withErrorHandling(
  async ({ ticketId }: { ticketId: number }) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const ticket = await prismaClient.consultationTicket.findUnique({
      where: { id: ticketId },
      include: {
        Clinic: { select: { clinicUid: true } },
        ClinicPatient: {
          include: {
            Patient: {
              include: {
                PhilHealthRecords: { take: 1 }
              }
            }
          }
        }
      }
    });

    if (!ticket) throw new Error("Consultation ticket not found");
    if (!ticket.konsultaAtcCode) throw new Error("No ATC code provided in this encounter");
    
    const phRecord = ticket.ClinicPatient?.Patient?.PhilHealthRecords?.[0];
    const pin = phRecord?.dependentPin || phRecord?.pin;
    
    if (!pin) {
      throw new Error("Patient does not have a PhilHealth PIN registered");
    }

    const clinicUid = ticket.Clinic.clinicUid;
    
    // Remove dashes from PIN
    const cleanPin = pin.replace(/\D/g, "");

    // Dynamic import to avoid circular dependencies if any
    const { verifyAtcAction } = await import("@/actions/philhealth-yakap.actions");

    // verifyAtcAction expects YYYY-MM-DD and formats it internally, so we use the standard ISO format
    const isoDate = ticket.createdAt.toISOString().split("T")[0];

    const result = await verifyAtcAction(clinicUid, cleanPin, ticket.konsultaAtcCode, isoDate);

    if (!result.status) {
      throw new Error(result.message || "Failed to verify ATC");
    }

    return {
      data: result.data,
      message: "ATC verification completed"
    };
  }
);
