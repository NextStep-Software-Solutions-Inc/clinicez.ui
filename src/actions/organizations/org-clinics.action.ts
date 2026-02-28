"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export type GetOrgClinicsData = Awaited<ReturnType<typeof getOrgClinicsAction>>;

export const getOrgClinicsAction = withErrorHandling(
  cache(async (orgUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const clinicOrgs = await prisma.clinicOrganization.findMany({
      where: {
        Organization: { orgUid, isActive: true },
        isActive: true,
      },
      select: {
        id: true,
        createdAt: true,
        Clinic: {
          select: {
            id: true,
            clinicUid: true,
            name: true,
            description: true,
            logo: true,
            email: true,
            isActive: true,
            customUrl: true,
            createdAt: true,
            ClinicSetting: {
              select: {
                isPublic: true,
                enableAppointment: true,
                enableConsultation: true,
                philhealthAccreditationNumber: true,
                facilityName: true,
                sendEmailNotification: true,
                emailToClinicOnly: true,
              },
            },
            _count: {
              select: {
                ClinicMembers: { where: { isActive: true } },
                ClinicPatients: true,
                Appointments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clinics = clinicOrgs.map((co) => ({
      linkId: co.id,
      linkedAt: co.createdAt,
      clinicUid: co.Clinic.clinicUid,
      name: co.Clinic.name,
      description: co.Clinic.description,
      logo: co.Clinic.logo,
      email: co.Clinic.email,
      isActive: co.Clinic.isActive,
      customUrl: co.Clinic.customUrl,
      createdAt: co.Clinic.createdAt,
      setting: co.Clinic.ClinicSetting ?? null,
      memberCount: co.Clinic._count.ClinicMembers,
      patientCount: co.Clinic._count.ClinicPatients,
      appointmentCount: co.Clinic._count.Appointments,
    }));

    const totalClinics = clinics.length;
    const activeClinics = clinics.filter((c) => c.isActive).length;
    const totalMembers = clinics.reduce((sum, c) => sum + c.memberCount, 0);
    const totalPatients = clinics.reduce((sum, c) => sum + c.patientCount, 0);
    const totalAppointments = clinics.reduce((sum, c) => sum + c.appointmentCount, 0);

    return {
      message: "Organization clinics fetched successfully",
      data: {
        clinics,
        summary: {
          totalClinics,
          activeClinics,
          inactiveClinics: totalClinics - activeClinics,
          totalMembers,
          totalPatients,
          totalAppointments,
        },
      },
    };
  })
);
