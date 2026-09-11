"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { Prisma } from "@prisma/client";
import { generateSerialNumber } from "@/lib/utils";
import { validateHealthcareProviderAuth, USER_WITH_HEALTHCARE_PROVIDERS_SELECT } from "@/lib/healthcare-provider-auth";
import { createNotification } from "@/actions/notifications/notification.action";
import { resolveClinicTemplateId, resolveClinicEffectiveTemplate } from "@/lib/resolve-clinic-template";

export type GetReferralSlipFilters = {
  clinicUid: string;
  patientId?: number;
  consultationTicketId?: number;
  hpIds?: number[];
  search?: string;
  distinct?: Prisma.ClinicReferralSlipScalarFieldEnum[];
};

export type GetReferralSlips = Awaited<ReturnType<typeof getReferralSlipsAction>>;
export const getReferralSlipsAction = withErrorHandling(async (filters: GetReferralSlipFilters) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { clinicUid, patientId, consultationTicketId, hpIds, distinct = [] } = filters ?? {};

  const referralSlips = await prisma.clinicReferralSlip.findMany({
    ...(!!distinct?.length ? { distinct } : {}),
    orderBy: { createdAt: "desc" },
    where: {
      isActive: true,
      deletedAt: null,
      Clinic: { clinicUid },
      ...(patientId ? { clinicPatientId: patientId } : {}),
      ...(consultationTicketId ? { consultationTicketId: consultationTicketId } : {}),
    },
    select: {
      id: true,
      serialNumber: true,
      createdAt: true,
      history: true,
      impression: true,
      recommendation: true,
      reason: true,
      referredTo: true,
      Clinic: { select: { id: true, name: true } },
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              dob: true,
              UserAddresses: {
                where: { isActive: true, isPrimary: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  address: true,
                  city: true,
                  state: true,
                  zipCode: true,
                  country: true,
                }
              },
            },
          },
        },
      },
      DocumentTemplate: {
        select: {
          id: true,
        },
      },
    },
  });

  return { message: "Referral slips fetched successfully", data: referralSlips };
});

export const getReferralSlipAction = withErrorHandling(async (id: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const referralSlip = await prisma.clinicReferralSlip.findUnique({
    where: { id },
    select: {
      id: true,
      serialNumber: true,
      createdAt: true,
      history: true,
      impression: true,
      recommendation: true,
      reason: true,
      referredTo: true,
      Clinic: { select: { id: true, name: true } },
      ClinicPatient: {
        select: {
          id: true,
          Patient: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              middleName: true,
              suffix: true,
              dob: true,
              gender: true,
              email: true,
              UserAddresses: {
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        }
      },
      CreatedBy: {
        include: {
          HealthcareProvider: {
            include: {
              HPProfile: true,
              ProfessionalDetails: true,
              HPType: true,
            }
          }
        }
      },
      DocumentTemplate: true,
      ConsultationTicket: true,
      Appointment: true,
    },
  });

  if (!referralSlip) throw new Error("Referral slip not found");

  const effectiveTemplate = await resolveClinicEffectiveTemplate(
    prisma,
    referralSlip.clinicId,
    "referral",
    referralSlip.DocumentTemplate
  );
  if (effectiveTemplate) {
    referralSlip.DocumentTemplate = effectiveTemplate;
  }

  return { message: "Referral slip fetched successfully", data: referralSlip };
});

type CreateReferralSlipPayload = {
  clinicUid: string;
  referredTo: string;
  patientId?: number;
  hpIds: number[];
  consultationTicketId: number;
  appointmentId: number; // Made required to match schema
  reason: string;
  history?: string;
  impression?: string;
  recommendation?: string;
}

export const createReferralSlipAction = withErrorHandling(async (input: CreateReferralSlipPayload) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const {
    clinicUid,
    referredTo,
    patientId,
    hpIds,
    consultationTicketId,
    appointmentId,
    reason,
    history,
    impression,
    recommendation
  } = input;

  if (!patientId) {
    throw new Error("Patient ID is required");
  }

  const serialNumber = generateSerialNumber();

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    const { authorizedHpId, createdBy } = validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "create referral slips"
    );

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true },
    });
    if (!clinic) throw new Error("Clinic not found");

    const templateId = await resolveClinicTemplateId(prisma, clinic.id, "referral");

    const shouldConnectAppointment = appointmentId && await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true }
    });

    if (!shouldConnectAppointment && appointmentId) {
      throw new Error("Appointment not found");
    }

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const referralSlipData: Prisma.ClinicReferralSlipCreateInput = {
      serialNumber: serialNumber,
      Clinic: { connect: { clinicUid } },
      ClinicPatient: { connect: { id: patientId } },
      DocumentTemplate: { connect: { id: templateId } },
      referredTo: referredTo,
      reason: reason,
      CreatedBy: { connect: { id: createdBy } },
      ConsultationTicket: { connect: { id: consultationTicketId } },
      Appointment: { connect: { id: appointmentId } },
      isActive: true,
      history: history || "",
      impression: impression || "",
      recommendation: recommendation || "",
    };

    const referralSlip = await prisma.clinicReferralSlip.create({
      data: referralSlipData,
    });

    return referralSlip;
  });

  // Notify the patient a referral slip was issued
  try {
    const clinicPatient = await prisma.clinicPatient.findUnique({
      where: { id: patientId },
      select: { patientId: true, Clinic: { select: { name: true } } },
    });
    if (clinicPatient) {
      await createNotification({
        userId: clinicPatient.patientId,
        type: "REFERRAL_ISSUED",
        title: "Referral Slip Issued",
        message: `A referral slip has been issued for you at ${clinicPatient.Clinic.name}.${referredTo ? ` Referred to: ${referredTo}.` : ""}`,
      });
    }
  } catch {
    // non-critical
  }

  return { message: "Referral slip created successfully", data: result };
});

export type UpdateReferralSlipInput = {
  id: number;
  clinicUid?: string;
  clinicPatientId?: number;
  documentTemplateId?: number;
  hpIds: number[];
  reason?: string;
  referredTo?: string;
  history?: string;
  impression?: string;
  recommendation?: string;
  pinCode?: string;
};

export const updateReferralSlipAction = withErrorHandling(async (input: UpdateReferralSlipInput) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const {
    id,
    clinicUid,
    clinicPatientId,
    documentTemplateId,
    hpIds,
    reason,
    referredTo,
    history,
    impression,
    recommendation,
    pinCode
  } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    const { createdBy } = validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "update referral slips"
    );

    const referralSlip = await prisma.clinicReferralSlip.update({
      where: { id },
      data: {
        ...(clinicUid && { Clinic: { connect: { clinicUid } } }),
        ...(clinicPatientId && { ClinicPatient: { connect: { id: clinicPatientId } } }),
        ...(documentTemplateId && { DocumentTemplate: { connect: { id: documentTemplateId } } }),
        ...(reason !== undefined && { reason }),
        ...(referredTo !== undefined && { referredTo }),
        ...(pinCode !== undefined && { pinCode }),
        UpdatedBy: { connect: { id: createdBy } },
        ...(history !== undefined && { history }),
        ...(impression !== undefined && { impression }),
        ...(recommendation !== undefined && { recommendation }),
      },
    });

    return referralSlip;
  });

  return { message: "Referral slip updated successfully", data: result };
});

export const deleteReferralSlipAction = withErrorHandling(async (input: { id: number; hpIds: number[] }) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthorized");

  const { id, hpIds } = input;

  const result = await prisma.$transaction(async (prisma) => {
    const appUser = await prisma.user.findUnique({
      where: {
        userId: session.user.sub,
        isActive: true,
        deletedAt: null,
      },
      select: USER_WITH_HEALTHCARE_PROVIDERS_SELECT
    });

    const { createdBy } = validateHealthcareProviderAuth(
      appUser,
      hpIds,
      "delete referral slips"
    );

    const referralSlip = await prisma.clinicReferralSlip.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        DeletedBy: { connect: { id: createdBy } },
      },
    });

    return referralSlip;
  });

  return { message: "Referral slip deleted successfully", data: result };
});