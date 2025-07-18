"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";

type CreateClinicPayload = {
  clinicUid: string;
  tenantUid: string;
  name: string;
  logo?: string;
}
export const createClinicAction = withErrorHandling(async (data: CreateClinicPayload) => {

  await sessionCheck();

  const { clinicUid, tenantUid, name, logo } = data;
  const newOrganization = await prisma.clinic.create({
    data: {
      Tenant: {
        connect: {
          tenantUid
        }
      },
      clinicUid,
      name,
      logo
    }
  });

  return { message: "Clinic created successfully", data: newOrganization };
});


export type GetClinicsFilters = {
  userId?: string;
  clinicUid?: string;
  orgUid?: string;
  isPublic?: boolean;
}

export type GetClinics = Awaited<ReturnType<typeof getClinicsAction>>
export const getClinicsAction = withErrorHandling(cache(async (filters?: GetClinicsFilters) => {

  await sessionCheck();

  const { clinicUid, orgUid, isPublic, userId } = filters || {};
  const clinics = await prisma.clinic.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      ...userId ? {
        ClinicMembers: {
          some: {
            User: {
              userId
            },
          }
        },
        ClinicPatients: {
          some: {
            Patient: {
              userId
            }
          }
        }
      } : {},
      ClinicSetting: {
        ...isPublic ? { isPublic } : {}
      },
      ...clinicUid ? { clinicUid } : {},
      ...orgUid ? {
        ClinicOrganizations: {
          some: {
            Organization: {
              orgUid
            }
          }
        }
      } : {},
      isActive: true
    }
  });
  return { message: "Clinics fetched successfully", data: clinics };
}));

export type GetClinic = Awaited<ReturnType<typeof getClinicAction>>
export const getClinicAction = withErrorHandling(cache(async (key: string | number) => {

  await sessionCheck();

  const clinic = await prisma.clinic.findFirst({
    where: {
      isActive: true,
      OR: [
        { ...!isNaN(Number(key)) ? { id: Number(key) } : {} },
        { clinicUid: String(key) }
      ]
    },
    select: {
      id: true,
      clinicUid: true,
      name: true,
      description: true,
      customUrl: true,
      logo: true,
      email: true,
      updatedAt: true,
      Tenant: {
        select: {
          id: true,
          tenantUid: true
        }
      },
      ClinicSetting: true,
    }
  });
  return { message: "Clinic fetched successfully", data: clinic };
}))

type UpdateClinicPayload = {
  name: string;
  description?: string;
  logo: string;
  customUrl?: string;
  email: string;
  isPublic: boolean;
  sendEmailNotification: boolean;
  emailToClinicOnly: boolean;
  enableAppointment: boolean;
  enableConsultation: boolean;
}
export const updateClinicAction = withErrorHandling(async (clinicUid: string, data: UpdateClinicPayload) => {

  await sessionCheck();

  const { name, logo, description, customUrl, email, isPublic, sendEmailNotification, emailToClinicOnly, enableAppointment, enableConsultation } = data;

  const clinic = await prisma.clinic.update({
    where: { clinicUid, isActive: true },
    data: {
      name,
      description,
      logo,
      customUrl,
      email,
      ClinicSetting: {
        upsert: {
          where: {
            Clinic: {
              clinicUid
            }
          },
          create: {
            isPublic,
            sendEmailNotification,
            emailToClinicOnly,
            enableAppointment,
            enableConsultation,
          },
          update: {
            isPublic: data.isPublic,
            sendEmailNotification,
            emailToClinicOnly,
            enableAppointment,
            enableConsultation,
          }
        }
      }
    },
    include: {
      ClinicSetting: true,
    }
  });
  return { message: "Successfully updated clinic.", data: clinic };
})

type CreateLaboratoryRequestPayload = {
  name: string;
  age: number;
  address: string;
  hematology?: string[];
  clinicalMicroscopy?: string[];
  bloodChemistry?: string[];
  clinicUid: string;
};

export const createLaboratoryRequestAction = withErrorHandling(async (data: CreateLaboratoryRequestPayload) => {
  await sessionCheck();

  const { name, age, address, hematology, clinicalMicroscopy, bloodChemistry, clinicUid } = data;

  // Mock for now- only static. Need permission from sir Wave.
  const newLaboratoryRequest = null;

  return { message: "Laboratory request created successfully", data: newLaboratoryRequest };
});