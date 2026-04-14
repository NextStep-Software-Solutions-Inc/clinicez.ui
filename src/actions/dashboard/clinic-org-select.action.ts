"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export interface ClinicOption {
  clinicUid: string;
  name: string;
  logo: string | null;
  role: string;
  canAccessDashboard: boolean;
}

export interface OrganizationOption {
  orgUid: string;
  name: string;
  role: string;
  canAccessDashboard: boolean;
}

/**
 * Fetch all clinic memberships for the current user
 */
export async function getClinicSelectOptionsAction(): Promise<ClinicOption[]> {
  const session = await getCachedSession();
  if (!session) return [];

  const userId = session.user.sub;

  const clinicMemberships = await prisma.clinicMember.findMany({
    where: {
      User: { userId },
      isActive: true,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      Clinic: {
        select: { clinicUid: true, name: true, logo: true },
      },
      Role: {
        select: { name: true, canAccessDashboard: true },
      },
    },
    orderBy: {
      Clinic: {
        name: "asc",
      },
    },
  });

  return clinicMemberships.map((m) => ({
    clinicUid: m.Clinic.clinicUid,
    name: m.Clinic.name,
    logo: m.Clinic.logo,
    role: m.Role.name,
    canAccessDashboard: m.Role.canAccessDashboard,
  }));
}

/**
 * Fetch all clinics associated with organizations the current user is a member of.
 * Intended for appointment booking - shows any clinic linked to the user's org memberships,
 * regardless of whether the user is a direct ClinicMember.
 */
export async function getOrgAssociatedClinicOptionsAction(): Promise<ClinicOption[]> {
  const session = await getCachedSession();
  if (!session) return [];

  const userId = session.user.sub;

  const orgMemberships = await prisma.organizationMember.findMany({
    where: {
      User: { userId },
      status: "ACTIVE",
    },
    select: {
      Organization: {
        select: {
          ClinicOrganizations: {
            where: {
              isActive: true,
              deletedAt: null,
            },
            select: {
              Clinic: {
                select: { clinicUid: true, name: true, logo: true },
              },
            },
          },
        },
      },
    },
  });

  // Flatten clinics from all org memberships and de-duplicate by clinicUid
  const seen = new Set<string>();
  const clinics: ClinicOption[] = [];

  for (const membership of orgMemberships) {
    for (const clinicOrg of membership.Organization.ClinicOrganizations) {
      if (!seen.has(clinicOrg.Clinic.clinicUid)) {
        seen.add(clinicOrg.Clinic.clinicUid);
        clinics.push({
          clinicUid: clinicOrg.Clinic.clinicUid,
          name: clinicOrg.Clinic.name,
          logo: clinicOrg.Clinic.logo,
          // This action is for appointment booking; dashboard access is not checked here
          role: "member",
          canAccessDashboard: true,
        });
      }
    }
  }

  return clinics.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch all organization memberships for the current user
 */
export async function getOrgSelectOptionsAction(): Promise<OrganizationOption[]> {
  const session = await getCachedSession();
  if (!session) return [];

  const userId = session.user.sub;

  const orgMemberships = await prisma.organizationMember.findMany({
    where: {
      User: { userId },
      status: "ACTIVE",
    },
    select: {
      Organization: {
        select: { orgUid: true, name: true },
      },
      OrganizationRole: {
        select: { name: true, canAccessDashboard: true },
      },
    },
    orderBy: {
      Organization: {
        name: "asc",
      },
    },
  });

  return orgMemberships.map((m) => ({
    orgUid: m.Organization.orgUid,
    name: m.Organization.name,
    role: m.OrganizationRole.name,
    canAccessDashboard: m.OrganizationRole.canAccessDashboard,
  }));
}
