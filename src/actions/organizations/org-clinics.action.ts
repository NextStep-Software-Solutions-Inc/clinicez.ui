"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import type { OrgClinicsData } from "@/types/org-clinics.types";

/**
 * Fetch comprehensive clinics data for an organization.
 * Includes per-clinic metrics (members, patients, appointments) and summary stats.
 */
export type GetOrgClinicsData = Awaited<ReturnType<typeof getOrgClinicsAction>>;
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
              },
            },
            _count: {
              select: {
                ClinicMembers: true,
                ClinicPatients: true,
                Appointments: true,
              },
            },
          },
        },
      },
      orderBy: {
        Clinic: { name: "asc" },
      },
    });

    const clinicIds = clinicOrgs.map(({ Clinic }) => Clinic.id);

    // Fetch active member counts for all clinics in a single query
    const activeMemberCounts = clinicIds.length > 0
      ? await prisma.clinicMember.groupBy({
          by: ["clinicId"],
          where: { clinicId: { in: clinicIds }, isActive: true, status: "ACTIVE" },
          _count: { clinicId: true },
        })
      : [];

    const activeMemberCountMap = new Map(
      activeMemberCounts.map((row) => [row.clinicId, row._count.clinicId])
    );

    const clinics = clinicOrgs.map(({ Clinic }) => ({
      id: Clinic.id,
      clinicUid: Clinic.clinicUid,
      name: Clinic.name,
      description: Clinic.description,
      logo: Clinic.logo,
      email: Clinic.email,
      isActive: Clinic.isActive,
      createdAt: Clinic.createdAt,
      memberCount: Clinic._count.ClinicMembers,
      activeMemberCount: activeMemberCountMap.get(Clinic.id) ?? 0,
      patientCount: Clinic._count.ClinicPatients,
      appointmentCount: Clinic._count.Appointments,
      setting: Clinic.ClinicSetting
        ? {
            isPublic: Clinic.ClinicSetting.isPublic,
            sendEmailNotification: Clinic.ClinicSetting.sendEmailNotification,
          }
        : null,
    }));

    const metrics = {
      totalClinics: clinics.length,
      activeClinics: clinics.filter((c) => c.isActive).length,
      inactiveClinics: clinics.filter((c) => !c.isActive).length,
      totalMembers: clinics.reduce((sum, c) => sum + c.memberCount, 0),
      totalPatients: clinics.reduce((sum, c) => sum + c.patientCount, 0),
      totalAppointments: clinics.reduce(
        (sum, c) => sum + c.appointmentCount,
        0
      ),
    };

    const data: OrgClinicsData = { clinics, metrics };
    return { message: "Organization clinics fetched successfully", data };
  })
);
