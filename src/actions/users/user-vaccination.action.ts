"use server";

import prisma from "@lib/prisma";
import { cache } from "react";
import { ImmunizationCategory } from "@prisma/client";

export type CreatePatientImmunizationInput = {
  userId: string;
  category: ImmunizationCategory;
  immunizationLibId?: number | null;
  code?: string | null;
  vaccineName: string;
  doseNumber: string;
  route?: string | null;
  dateGiven: Date;
  administeredBy?: string | null;
  facilityName?: string | null;
  lotNumber?: string | null;
  expirationDate?: Date | null;
  notes?: string | null;
};

export type UserVaccinationPayloadType = {
  userId: string;
  category?: ImmunizationCategory;
  immunizationLibId?: number | null;
  code?: string | null;
  vaccineName?: string;
  doseNumber?: string;
  route?: string | null;
  dateGiven: Date;
  administeredBy?: string | null;
  facilityName?: string | null;
  lotNumber?: string | null;
  expirationDate?: Date | null;
  notes?: string | null;
  // Legacy compat
  vaccineId?: number;
  routeId?: number;
  doseId?: number;
};

export const createUserVaccinationAction = async (payload: UserVaccinationPayloadType) => {
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { userId: payload.userId, isActive: true },
    select: { id: true },
  });

  let libItem = null;
  if (payload.immunizationLibId) {
    libItem = await prisma.philHealthImmunizationLibrary.findUnique({
      where: { id: payload.immunizationLibId },
    });
  } else if (payload.code && payload.category) {
    libItem = await prisma.philHealthImmunizationLibrary.findUnique({
      where: {
        unique_category_code: {
          category: payload.category,
          code: payload.code,
        },
      },
    });
  }

  const category = payload.category || libItem?.category || ImmunizationCategory.OTHER;
  const code = payload.code || libItem?.code || null;
  const vaccineName = payload.vaccineName || libItem?.name || 'Unspecified Vaccine';
  const doseNumber = payload.doseNumber || libItem?.defaultDoseLabel || '1st Dose';
  const route = payload.route || libItem?.defaultRoute || null;

  return await prisma.patientImmunization.create({
    data: {
      userId: currentUser.id,
      immunizationLibId: libItem?.id || null,
      category,
      code,
      vaccineName,
      doseNumber,
      route,
      dateGiven: payload.dateGiven,
      administeredBy: payload.administeredBy || null,
      facilityName: payload.facilityName || null,
      lotNumber: payload.lotNumber || null,
      expirationDate: payload.expirationDate || null,
      notes: payload.notes || null,
    },
  });
};

export type GetUserVaccinations = Awaited<ReturnType<typeof getUserVaccinationsAction>>;
export const getUserVaccinationsAction = cache(async (userId: string) => {
  const records = await prisma.patientImmunization.findMany({
    orderBy: {
      dateGiven: 'desc',
    },
    where: {
      isActive: true,
      deletedAt: null,
      User: {
        userId,
      },
    },
    include: {
      PhilHealthImmunization: true,
    },
  });

  return records.map((r) => ({
    id: r.id,
    vaccine: r.vaccineName,
    dose: r.doseNumber,
    route: r.route || 'N/A',
    dateGiven: r.dateGiven,
    administeredBy: r.administeredBy,
    facilityName: r.facilityName,
    lotNumber: r.lotNumber,
    notes: r.notes,
    category: r.category,
    code: r.code,
    reportStatus: r.reportStatus,
    deficiencyRemarks: r.deficiencyRemarks,
    // Emulate nested objects for legacy callers
    Vaccine: {
      id: r.PhilHealthImmunization?.id || 0,
      type: r.category,
      name: r.vaccineName,
    },
    Route: {
      id: 0,
      route: r.route || 'N/A',
    },
    Dose: {
      id: 0,
      dose: r.doseNumber,
    },
  }));
});

export const updateUserVaccinationAction = async (id: number, payload: UserVaccinationPayloadType) => {
  let libItem = null;
  if (payload.immunizationLibId) {
    libItem = await prisma.philHealthImmunizationLibrary.findUnique({
      where: { id: payload.immunizationLibId },
    });
  }

  return await prisma.patientImmunization.update({
    where: { id, isActive: true },
    data: {
      immunizationLibId: libItem?.id || undefined,
      category: payload.category || libItem?.category || undefined,
      code: payload.code || libItem?.code || undefined,
      vaccineName: payload.vaccineName || libItem?.name || undefined,
      doseNumber: payload.doseNumber || libItem?.defaultDoseLabel || undefined,
      route: payload.route || libItem?.defaultRoute || undefined,
      dateGiven: payload.dateGiven,
      administeredBy: payload.administeredBy || undefined,
      facilityName: payload.facilityName || undefined,
      lotNumber: payload.lotNumber || undefined,
      expirationDate: payload.expirationDate || undefined,
      notes: payload.notes || undefined,
    },
  });
};

export const deleteUserVaccinationAction = async (id: number) => {
  return await prisma.patientImmunization.update({
    where: { id, isActive: true },
    data: { isActive: false, deletedAt: new Date() },
  });
};