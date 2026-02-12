"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export interface ClinicOption {
  clinicUid: string;
  name: string;
}

export interface OrganizationOption {
  orgUid: string;
  name: string;
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
        select: { clinicUid: true, name: true },
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
  }));
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
  }));
}
