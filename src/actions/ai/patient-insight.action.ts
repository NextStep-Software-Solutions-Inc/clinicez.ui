"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  getOrchestrator,
  createMessage,
  sanitizeInput,
} from "@/lib/ai";

/** How long (in hours) a cached insight is considered valid before regeneration. */
const INSIGHT_VALIDITY_HOURS = 24;

export type PatientInsightResult =
  | { status: true; data: { content: string; validUntil: Date; createdAt: Date; isFromCache: boolean } }
  | { status: false; message: string };

/**
 * Returns a cached AI-generated insight for a patient if one is still valid,
 * otherwise generates a new one, persists it, and returns it.
 *
 * @param patientId   Prisma User.id of the patient
 * @param clinicId    Optional Clinic.id to scope the insight
 * @param forceRegen  When true, skip the cache and always regenerate
 */
export async function getOrGeneratePatientInsightAction(
  patientId: number,
  clinicId?: number,
  forceRegen = false,
): Promise<PatientInsightResult> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { status: false, message: "Authentication required" };
  }

  const now = new Date();

  // ── 1. Check cache ──────────────────────────────────────────────────────
  if (!forceRegen) {
    const cached = await prisma.patientInsight.findFirst({
      where: {
        patientId,
        clinicId: clinicId ?? null,
        validUntil: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      return {
        status: true,
        data: {
          content: cached.content,
          validUntil: cached.validUntil,
          createdAt: cached.createdAt,
          isFromCache: true,
        },
      };
    }
  }

  // ── 2. Fetch patient data for context ───────────────────────────────────
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    select: {
      firstName: true,
      lastName: true,
      dob: true,
      gender: true,
      bloodType: true,
      UserAllergies: {
        select: {
          Allergen: { select: { name: true } },
          reaction: true,
          notes: true,
        },
      },
      UserHealthConditions: {
        select: {
          HealthCondition: { select: { name: true } },
          status: true,
          notes: true,
        },
      },
      MedicalHistories: {
        select: {
          Condition: { select: { name: true } },
          details: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      FamilyMedicalHistories: {
        select: {
          Condition: { select: { name: true } },
          details: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      VitalSigns: {
        select: {
          dateTaken: true,
          temp: true,
          pulseRate: true,
          respRate: true,
          spo2: true,
          weight: true,
          height: true,
          bmi: true,
          bpSystolic: true,
          bpDiastolic: true,
        },
        orderBy: { dateTaken: "desc" },
        take: 5,
      },
    },
  });

  if (!patient) {
    return { status: false, message: "Patient not found" };
  }

  // Fetch appointment + consultation stats separately
  const [appointmentCount, conditionCount] = await Promise.all([
    clinicId
      ? prisma.appointment.count({
          where: {
            Requesters: { some: { User: { id: patientId } } },
            clinicId,
          },
        })
      : prisma.appointment.count({
          where: { Requesters: { some: { User: { id: patientId } } } },
        }),
    prisma.userHealthCondition.count({ where: { userId: patientId } }),
  ]);

  // ── 3. Build prompt ─────────────────────────────────────────────────────
  const parts: string[] = [];

  const dob = patient.dob ? new Date(patient.dob) : null;
  const ageYears = dob
    ? Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  if (ageYears !== null) parts.push(`Age: ${ageYears}`);
  if (patient.gender) parts.push(`Gender: ${patient.gender}`);
  if (patient.bloodType) parts.push(`Blood Type: ${patient.bloodType}`);
  parts.push(`Total appointments: ${appointmentCount}`);
  parts.push(`Active conditions: ${conditionCount}`);

  if (patient.UserAllergies.length > 0) {
    const allergyStr = patient.UserAllergies.map(
      (a) => `${a.Allergen?.name ?? "unknown"} (${a.reaction ?? "reaction unknown"})`,
    ).join(", ");
    parts.push(`Allergies: ${allergyStr}`);
  }

  if (patient.UserHealthConditions.length > 0) {
    const condStr = patient.UserHealthConditions.map(
      (c) => `${c.HealthCondition?.name ?? "unknown"} [${c.status ?? "unknown status"}]`,
    ).join(", ");
    parts.push(`Health Conditions: ${condStr}`);
  }

  if (patient.MedicalHistories.length > 0) {
    const medStr = patient.MedicalHistories.map((m) => m.Condition?.name ?? "unknown").join(", ");
    parts.push(`Medical History: ${medStr}`);
  }

  if (patient.FamilyMedicalHistories.length > 0) {
    const fhStr = patient.FamilyMedicalHistories.map((f) => f.Condition?.name ?? "unknown").join(", ");
    parts.push(`Family History: ${fhStr}`);
  }

  if (patient.VitalSigns.length > 0) {
    const latestVital = patient.VitalSigns[0];
    const vParts: string[] = [];
    if (latestVital.bpSystolic && latestVital.bpDiastolic)
      vParts.push(`BP ${latestVital.bpSystolic}/${latestVital.bpDiastolic} mmHg`);
    if (latestVital.pulseRate) vParts.push(`HR ${latestVital.pulseRate} bpm`);
    if (latestVital.temp) vParts.push(`Temp ${latestVital.temp}°C`);
    if (latestVital.weight) vParts.push(`Weight ${latestVital.weight} kg`);
    if (latestVital.bmi) vParts.push(`BMI ${latestVital.bmi.toFixed(1)}`);
    if (vParts.length > 0)
      parts.push(`Latest Vitals (${new Date(latestVital.dateTaken).toLocaleDateString()}): ${vParts.join(", ")}`);
  }

  const patientSummary = parts.join("\n");

  const systemPrompt = `You are a clinical decision support system assisting healthcare providers.
Generate a concise, structured patient insight summary for provider use only.
Focus on clinically actionable information: health patterns, risk factors, care gaps, and follow-up priorities.
Use professional medical language. Format with clear sections using markdown headings.
Keep the summary focused and evidence-based. Do NOT make definitive diagnoses.`;

  const prompt = `Generate a clinical insight summary for the following patient profile:

${sanitizeInput(patientSummary)}

Provide a structured insight covering:
1. **Patient Overview** – brief demographic and health snapshot
2. **Key Health Concerns** – active conditions, allergies, and significant history
3. **Vital Signs Trend** – observations from latest vitals (if available)
4. **Care Priorities** – recommended areas of focus or follow-up
5. **Risk Flags** – any notable risk factors to monitor

Keep each section concise. This is for healthcare provider use only.`;

  // ── 4. Call AI ──────────────────────────────────────────────────────────
  let content: string;
  try {
    const orchestrator = getOrchestrator();
    const response = await orchestrator.complete({
      messages: [createMessage("user", prompt)],
      systemPrompt,
      temperature: 0.4,
      maxTokens: 1200,
    });
    content = response.content;
  } catch (err) {
    console.error("AI patient insight generation error:", err);
    return {
      status: false,
      message: err instanceof Error ? err.message : "AI generation failed",
    };
  }

  // ── 5. Persist ──────────────────────────────────────────────────────────
  const validUntil = new Date(
    now.getTime() + INSIGHT_VALIDITY_HOURS * 60 * 60 * 1000,
  );

  const saved = await prisma.patientInsight.create({
    data: {
      patientId,
      clinicId: clinicId ?? null,
      content,
      generatedByUserId: clerkUserId,
      validUntil,
    },
  });

  return {
    status: true,
    data: {
      content: saved.content,
      validUntil: saved.validUntil,
      createdAt: saved.createdAt,
      isFromCache: false,
    },
  };
}
