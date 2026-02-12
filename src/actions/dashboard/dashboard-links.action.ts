"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export interface DashboardLink {
  label: string;
  href: string;
  type: "patient" | "tenant" | "clinic" | "organization";
}

/**
 * Returns the v2 dashboard links the current user has access to.
 *
 * - Patient dashboard: always available for authenticated users
 * - Tenant dashboard: if the user owns at least one active tenant
 * - Clinic dashboard(s): one per active clinic membership
 * - Organization dashboard(s): one per active organization membership
 */
export async function getDashboardLinksAction(): Promise<DashboardLink[]> {
  const session = await getCachedSession();
  if (!session) return [];

  const userId = session.user.sub;

  const links: DashboardLink[] = [
    { label: "Patient Dashboard", href: "/patient/dashboard", type: "patient" },
  ];

  // Run queries in parallel
  const [tenants, clinicMemberships, orgMemberships] = await Promise.all([
    prisma.tenant.findMany({
      where: { Owner: { userId }, isActive: true },
      select: { tenantUid: true, name: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.clinicMember.findMany({
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
      take: 5,
    }),
    prisma.organizationMember.findMany({
      where: {
        User: { userId },
        status: "ACTIVE",
      },
      select: {
        Organization: {
          select: { orgUid: true, name: true },
        },
      },
      take: 5,
    }),
  ]);

  // Tenant dashboard — available if user owns any tenant
  if (tenants.length > 0) {
    links.push({
      label: "Tenant Dashboard",
      href: "/tenant/dashboard",
      type: "tenant",
    });
  }

  // Clinic dashboards — one per active membership
  for (const membership of clinicMemberships) {
    links.push({
      label: `${membership.Clinic.name}`,
      href: `/clinic/${membership.Clinic.clinicUid}/dashboard`,
      type: "clinic",
    });
  }

  // Organization dashboards — one per active membership
  for (const membership of orgMemberships) {
    links.push({
      label: `${membership.Organization.name}`,
      href: `/org/${membership.Organization.orgUid}/dashboard`,
      type: "organization",
    });
  }

  return links;
}
