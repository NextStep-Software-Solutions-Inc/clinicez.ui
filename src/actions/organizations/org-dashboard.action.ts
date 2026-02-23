"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";
import type { OrgDashboardData } from "@/types/org-dashboard.types";

/**
 * Fetch comprehensive organization dashboard data.
 * Includes KPIs, member breakdown, linked clinics, role distribution, and recent activity.
 */
export type GetOrgDashboardData = Awaited<ReturnType<typeof getOrgDashboardDataAction>>;
export const getOrgDashboardDataAction = withErrorHandling(
  cache(async (orgUid: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const organization = await prisma.organization.findFirst({
      where: { orgUid, isActive: true },
      select: {
        id: true,
        orgUid: true,
        name: true,
        description: true,
        logo: true,
        email: true,
        isActive: true,
        createdAt: true,
        OrganizationSetting: {
          select: {
            isPublic: true,
            sendEmailNotification: true,
            emailToOrgOnly: true,
          },
        },
      },
    });

    if (!organization) throw new Error(`Organization with UID ${orgUid} not found`);

    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      suspendedMembers,
      totalClinics,
      totalRoles,
      totalDepartments,
      totalColleges,
      totalPrograms,
      totalOffices,
      recentMemberRows,
      clinicRows,
      roleRows,
    ] = await Promise.all([
      prisma.organizationMember.count({
        where: { Organization: { orgUid } },
      }),
      prisma.organizationMember.count({
        where: { Organization: { orgUid }, status: "ACTIVE" },
      }),
      prisma.organizationMember.count({
        where: { Organization: { orgUid }, status: "PENDING" },
      }),
      prisma.organizationMember.count({
        where: { Organization: { orgUid }, status: "SUSPENDED" },
      }),
      prisma.clinicOrganization.count({
        where: { Organization: { orgUid } },
      }),
      prisma.organizationRole.count({
        where: { Organization: { orgUid }, isActive: true },
      }),
      prisma.organizationDepartment.count({
        where: { Organization: { orgUid } },
      }),
      prisma.organizationCollege.count({
        where: { Organization: { orgUid } },
      }),
      prisma.organizationProgram.count({
        where: { Organization: { orgUid } },
      }),
      prisma.organizationOffice.count({
        where: { Organization: { orgUid } },
      }),
      // Recent 8 members
      prisma.organizationMember.findMany({
        where: { Organization: { orgUid } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          createdAt: true,
          status: true,
          User: {
            select: {
              firstName: true,
              lastName: true,
              picture: true,
            },
          },
          OrganizationRole: {
            select: { name: true },
          },
        },
      }),
      // Linked clinics
      prisma.clinicOrganization.findMany({
        where: { Organization: { orgUid } },
        select: {
          Clinic: {
            select: {
              clinicUid: true,
              name: true,
              logo: true,
            },
          },
        },
      }),
      // Role breakdown with member counts
      prisma.organizationRole.findMany({
        where: { Organization: { orgUid }, isActive: true },
        select: {
          id: true,
          name: true,
          _count: { select: { OrganizationMembers: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const data: OrgDashboardData = {
      organization: {
        id: organization.id,
        orgUid: organization.orgUid,
        name: organization.name,
        description: organization.description,
        logo: organization.logo,
        email: organization.email,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        setting: organization.OrganizationSetting ?? null,
      },
      metrics: {
        totalMembers,
        activeMembers,
        pendingMembers,
        suspendedMembers,
        totalClinics,
        totalRoles,
        totalDepartments,
        totalColleges,
        totalPrograms,
        totalOffices,
      },
      recentMembers: recentMemberRows.map((m) => ({
        id: m.id,
        name: `${m.User.firstName ?? ""} ${m.User.lastName ?? ""}`.trim() || "Unknown",
        roleName: m.OrganizationRole.name,
        status: m.status,
        joinedAt: m.createdAt,
        picture: m.User.picture,
      })),
      clinics: clinicRows.map((c) => ({
        clinicUid: c.Clinic.clinicUid,
        name: c.Clinic.name,
        logo: c.Clinic.logo,
      })),
      roleBreakdown: roleRows.map((r) => ({
        id: r.id,
        name: r.name,
        memberCount: r._count.OrganizationMembers,
      })),
    };

    return { message: "Organization dashboard data fetched successfully", data };
  })
);
