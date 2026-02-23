"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export type GetOrgClinics = Awaited<ReturnType<typeof getOrgClinicsAction>>;
export const getOrgClinicsAction = withErrorHandling(
  cache(async (orgUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const clinicOrgs = await prisma.clinicOrganization.findMany({
      where: {
        Organization: { orgUid },
        isActive: true,
      },
      select: {
        Clinic: {
          select: {
            id: true,
            clinicUid: true,
            name: true,
            description: true,
            logo: true,
            email: true,
            isActive: true,
            createdAt: true,
            ClinicSetting: {
              select: {
                isPublic: true,
                sendEmailNotification: true,
                enableAppointment: true,
                enableConsultation: true,
                philhealthAccreditationNumber: true,
                facilityName: true,
              },
            },
            ClinicMembers: {
              where: { isActive: true, status: "ACTIVE" },
              select: { id: true },
            },
            ClinicPatients: {
              where: { isActive: true },
              select: { id: true },
            },
            AppointmentModes: {
              where: { isActive: true },
              select: { id: true },
            },
            AppointmentTypes: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        Clinic: { name: "asc" },
      },
    });

    const data = clinicOrgs.map((co) => ({
      clinicUid: co.Clinic.clinicUid,
      name: co.Clinic.name,
      description: co.Clinic.description,
      logo: co.Clinic.logo,
      email: co.Clinic.email,
      isActive: co.Clinic.isActive,
      createdAt: co.Clinic.createdAt,
      setting: co.Clinic.ClinicSetting ?? null,
      memberCount: co.Clinic.ClinicMembers.length,
      patientCount: co.Clinic.ClinicPatients.length,
      appointmentModeCount: co.Clinic.AppointmentModes.length,
      appointmentTypeCount: co.Clinic.AppointmentTypes.length,
    }));

    return {
      message: "Organization clinics fetched successfully",
      data,
    };
  })
);
