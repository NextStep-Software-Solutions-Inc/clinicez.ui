"use server";

import prisma from "@lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export type HPClinic = {
  clinicUid: string;
  name: string;
  logo: string | null;
  isPublic: boolean;
};

export type GetHPClinicsResult = Awaited<ReturnType<typeof getHPClinicsAction>>;

/**
 * Returns the list of clinics associated with a given healthcare provider
 * that are accessible to the current user.
 *
 * A clinic is accessible if:
 *   1. Its ClinicSetting.isPublic === true (open to everyone), OR
 *   2. The current user is a direct ClinicMember of that clinic, OR
 *   3. The current user is an active OrganizationMember of any org that is
 *      affiliated with that clinic (via ClinicOrganization).
 */
export async function getHPClinicsAction(hpId: number): Promise<HPClinic[]> {
  if (!hpId || !Number.isFinite(hpId)) return [];

  // Fetch the HP with their clinic memberships and org affiliations
  const hp = await prisma.healthcareProvider.findFirst({
    where: { id: hpId, isActive: true },
    select: {
      User: {
        select: {
          id: true,
          ClinicMembers: {
            where: { isActive: true, deletedAt: null },
            select: {
              Clinic: {
                select: {
                  clinicUid: true,
                  name: true,
                  logo: true,
                  ClinicSetting: {
                    select: { isPublic: true },
                  },
                  ClinicOrganizations: {
                    where: { isActive: true, deletedAt: null },
                    select: { organizationId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!hp) return [];

  const clinics = hp.User.ClinicMembers.map((m) => m.Clinic);

  if (!clinics.length) return [];

  // Determine current user's org memberships
  const clerkUser = await currentUser();
  let userOrgIds = new Set<number>();

  if (clerkUser?.id) {
    const userRecord = await prisma.user.findFirst({
      where: { userId: clerkUser.id },
      select: {
        OrganizationMembers: {
          where: {
            status: { in: ["ACCEPTED", "APPROVED", "ACTIVE"] },
          },
          select: { organizationId: true },
        },
      },
    });

    if (userRecord) {
      userOrgIds = new Set(
        userRecord.OrganizationMembers.map((m) => m.organizationId)
      );
    }
  }

  return clinics
    .filter((clinic) => {
      const isPublic = clinic.ClinicSetting?.isPublic ?? false;
      if (isPublic) return true;

      // Check if the user belongs to any affiliated org
      const affiliatedOrgIds = clinic.ClinicOrganizations.map(
        (co) => co.organizationId
      );
      return affiliatedOrgIds.some((orgId) => userOrgIds.has(orgId));
    })
    .map((clinic) => ({
      clinicUid: clinic.clinicUid,
      name: clinic.name,
      logo: clinic.logo ?? null,
      isPublic: clinic.ClinicSetting?.isPublic ?? false,
    }));
}
