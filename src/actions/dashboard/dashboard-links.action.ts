"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";

export interface DashboardLink {
  label: string;
  href: string;
  type: "patient" | "tenant" | "clinic" | "organization";
}

export interface HPOption {
  id: number;
  name: string;
  title: string;
  href: string;
}

export interface ClinicDashboardOption {
  clinicUid: string;
  name: string;
  role: string;
  canAccessDashboard: boolean;
  href: string;
}

export interface OrgDashboardOption {
  orgUid: string;
  name: string;
  role: string;
  canAccessDashboard: boolean;
  href: string;
}

export interface DashboardOptions {
  hasPatient: boolean;
  tenants: { name: string; href: string }[];
  hpProfiles: HPOption[];
  clinics: ClinicDashboardOption[];
  organizations: OrgDashboardOption[];
}

/**
 * Returns all dashboard options for the "select dashboard" page.
 *
 * Aggregates every POV the current user has:
 * - Patient: always available
 * - Tenant: if user owns an active tenant
 * - Healthcare Provider: if user has an active HP profile
 * - Clinics: all active clinic memberships
 * - Organizations: all active org memberships
 */
export async function getDashboardOptionsAction(): Promise<DashboardOptions> {
  const session = await getCachedSession();
  if (!session) {
    return { hasPatient: false, tenants: [], hpProfiles: [], clinics: [], organizations: [] };
  }

  const userId = session.user.sub;

  const [tenants, clinicMemberships, orgMemberships, hpProviders] = await Promise.all([
    prisma.tenant.findMany({
      where: { Owner: { userId }, isActive: true },
      select: { tenantUid: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.clinicMember.findMany({
      where: { User: { userId }, isActive: true, status: "ACTIVE", deletedAt: null },
      select: {
        Clinic: { select: { clinicUid: true, name: true } },
        Role: { select: { canAccessDashboard: true, name: true } },
      },
      orderBy: { Clinic: { name: "asc" } },
    }),
    prisma.organizationMember.findMany({
      where: { User: { userId }, status: "ACTIVE" },
      select: {
        Organization: { select: { orgUid: true, name: true } },
        OrganizationRole: { select: { canAccessDashboard: true, name: true } },
      },
      orderBy: { Organization: { name: "asc" } },
    }),
    prisma.healthcareProvider.findMany({
      where: { User: { userId }, isActive: true },
      select: {
        id: true,
        HPProfile: { select: { id: true, name: true, title: true } },
      },
    }),
  ]);

  return {
    hasPatient: true,
    tenants: tenants.map((t) => ({ name: t.name, href: "/v2/tenant/dashboard" })),
    hpProfiles: hpProviders.flatMap((hp) =>
      hp.HPProfile
        ? [{ id: hp.id, name: hp.HPProfile.name, title: hp.HPProfile.title, href: `/hp/${hp.id}` }]
        : []
    ),
    clinics: clinicMemberships.map((m) => ({
      clinicUid: m.Clinic.clinicUid,
      name: m.Clinic.name,
      role: m.Role.name,
      canAccessDashboard: m.Role.canAccessDashboard,
      href: `/v2/clinic/${m.Clinic.clinicUid}`,
    })),
    organizations: orgMemberships.map((m) => ({
      orgUid: m.Organization.orgUid,
      name: m.Organization.name,
      role: m.OrganizationRole.name,
      canAccessDashboard: m.OrganizationRole.canAccessDashboard,
      href: `/v2/org/${m.Organization.orgUid}`,
    })),
  };
}

/**
 * Returns the v2 dashboard links the current user has access to.
 *
 * - Patient dashboard: always available for authenticated users
 * - Tenant dashboard: if the user owns at least one active tenant
 * - Clinic dashboard(s): one per active clinic membership
 * - Organization dashboard(s): one per active organization membership
 *
 * Note: In v2 mode, clinic and organization links are consolidated into
 * single selector links that trigger a modal. In v1 (classic) mode, individual
 * links are shown for each clinic and organization.
 */
export async function getDashboardLinksAction(): Promise<DashboardLink[]> {
  const session = await getCachedSession();
  if (!session) return [];

  const userId = session.user.sub;

  const links: DashboardLink[] = [
    { label: "Patient Dashboard", href: "/v2/patient/", type: "patient" },
  ];

  // Run queries in parallel — limit to 5 results each to keep the avatar
  // menu compact. Users with more memberships can access full lists from
  // their respective dashboard pages.
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
        Role: {
          select: { canAccessDashboard: true, name: true },
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
        OrganizationRole: {
          select: { canAccessDashboard: true, name: true },
        },
      },
      take: 5,
    }),
  ]);

  // Tenant dashboard — available if user owns any tenant
  if (tenants.length > 0) {
    links.push({
      label: "Tenant Dashboard",
      href: "/v2/tenant/dashboard",
      type: "tenant",
    });
  }

  // Clinic dashboards — only include memberships where role has dashboard access or is clinic owner
  for (const membership of clinicMemberships) {
    const isClinicOwner = membership.Role.name?.toLowerCase() === "owner";
    if (!membership.Role.canAccessDashboard && !isClinicOwner) continue;
    links.push({
      label: `${membership.Clinic.name}`,
      href: `/v2/clinic/${membership.Clinic.clinicUid}/dashboard`,
      type: "clinic",
    });
  }

  // Organization dashboards — only include memberships where role has dashboard access or is org owner/admin
  for (const membership of orgMemberships) {
    const orgRoleName = membership.OrganizationRole.name?.toLowerCase();
    const isOrgOwnerOrAdmin = orgRoleName === "owner" || orgRoleName === "admin";
    if (!membership.OrganizationRole.canAccessDashboard && !isOrgOwnerOrAdmin) continue;
    links.push({
      label: `${membership.Organization.name}`,
      href: `/v2/org/${membership.Organization.orgUid}`,
      type: "organization",
    });
  }

  return links;
}
