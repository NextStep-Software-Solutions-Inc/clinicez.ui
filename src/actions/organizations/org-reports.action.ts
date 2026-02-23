"use server";

import prisma from "@lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getCachedSession } from "@actions/session.action";

export type OrgReportParams = {
  orgUid: string;
  from: Date;
  to: Date;
};

export type GetOrgReports = Awaited<ReturnType<typeof getOrgReportsAction>>;

export const getOrgReportsAction = withErrorHandling(
  async ({ orgUid, from, to }: OrgReportParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated");

    const org = await prisma.organization.findFirst({
      where: { orgUid, isActive: true },
      select: { id: true, name: true, orgUid: true },
    });
    if (!org) throw new Error("Organization not found");

    const dateFilter = { gte: from, lte: to };

    const [
      // All active members with user + role details
      allMembers,
      // New members who joined in the selected period
      newMembersInPeriod,
      // Pending membership requests
      pendingCount,
      // Suspended members
      suspendedCount,
      // Member gender distribution (via User)
      memberGenders,
      // Member age data (via User dob)
      memberAges,
      // Student records breakdown by college / program / year level
      studentRecords,
      // Employment records breakdown by department / office
      employmentRecords,
    ] = await Promise.all([
      // ── All active members ───────────────────────────────────────────────
      prisma.organizationMember.findMany({
        where: { organizationId: org.id, status: "ACTIVE" },
        select: {
          id: true,
          createdAt: true,
          OrganizationRole: { select: { name: true } },
          User: {
            select: {
              gender: true,
              dob: true,
            },
          },
        },
      }),

      // ── New members in period ────────────────────────────────────────────
      prisma.organizationMember.count({
        where: {
          organizationId: org.id,
          status: "ACTIVE",
          createdAt: dateFilter,
        },
      }),

      // ── Pending membership requests ──────────────────────────────────────
      prisma.organizationMember.count({
        where: { organizationId: org.id, status: "PENDING" },
      }),

      // ── Suspended members ────────────────────────────────────────────────
      prisma.organizationMember.count({
        where: { organizationId: org.id, status: "SUSPENDED" },
      }),

      // ── Member gender distribution ───────────────────────────────────────
      prisma.organizationMember.findMany({
        where: { organizationId: org.id, status: "ACTIVE" },
        select: {
          User: { select: { gender: true } },
        },
      }),

      // ── Member age data ──────────────────────────────────────────────────
      prisma.organizationMember.findMany({
        where: { organizationId: org.id, status: "ACTIVE" },
        select: {
          User: { select: { dob: true } },
        },
      }),

      // ── Student records breakdown ────────────────────────────────────────
      prisma.userStudentRecord.findMany({
        where: {
          organizationId: org.id,
          isActive: true,
          deletedAt: null,
        },
        select: {
          College: { select: { name: true } },
          Program: { select: { name: true } },
          OrganizationYearLevel: { select: { name: true } },
        },
      }),

      // ── Employment records breakdown ─────────────────────────────────────
      prisma.userEmploymentRecord.findMany({
        where: {
          organizationId: org.id,
          isActive: true,
          deletedAt: null,
        },
        select: {
          Department: { select: { name: true } },
          Office: { select: { name: true } },
        },
      }),
    ]);

    // ── Process member role counts ────────────────────────────────────────────
    const membersByRole: Record<string, number> = {};
    for (const m of allMembers) {
      const role = m.OrganizationRole.name;
      membersByRole[role] = (membersByRole[role] ?? 0) + 1;
    }

    // ── Process daily registration trend (in period) ──────────────────────────
    const registrationsByDay: Record<string, number> = {};
    for (const m of allMembers) {
      const day = m.createdAt.toISOString().slice(0, 10);
      // Only include days within the selected period
      if (m.createdAt >= from && m.createdAt <= to) {
        registrationsByDay[day] = (registrationsByDay[day] ?? 0) + 1;
      }
    }

    // ── Process gender distribution ───────────────────────────────────────────
    const genderCounts: Record<string, number> = {};
    for (const m of memberGenders) {
      const g = m.User.gender ?? "Unknown";
      genderCounts[g] = (genderCounts[g] ?? 0) + 1;
    }

    // ── Process age group distribution ────────────────────────────────────────
    const ageGroupCounts: Record<string, number> = {
      "0-12": 0,
      "13-17": 0,
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-59": 0,
      "60+": 0,
      Unknown: 0,
    };
    const now = new Date();
    for (const m of memberAges) {
      const dob = m.User.dob;
      if (dob) {
        const ageYears = Math.floor(
          (now.getTime() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        );
        if (ageYears <= 12) ageGroupCounts["0-12"]++;
        else if (ageYears <= 17) ageGroupCounts["13-17"]++;
        else if (ageYears <= 25) ageGroupCounts["18-25"]++;
        else if (ageYears <= 35) ageGroupCounts["26-35"]++;
        else if (ageYears <= 45) ageGroupCounts["36-45"]++;
        else if (ageYears <= 59) ageGroupCounts["46-59"]++;
        else ageGroupCounts["60+"]++;
      } else {
        ageGroupCounts["Unknown"]++;
      }
    }

    // ── Process student record breakdowns ─────────────────────────────────────
    const byCollege: Record<string, number> = {};
    const byProgram: Record<string, number> = {};
    const byYearLevel: Record<string, number> = {};
    for (const sr of studentRecords) {
      const college = sr.College?.name ?? "Unknown";
      byCollege[college] = (byCollege[college] ?? 0) + 1;

      const program = sr.Program?.name ?? "Unknown";
      byProgram[program] = (byProgram[program] ?? 0) + 1;

      const yearLevel = sr.OrganizationYearLevel?.name ?? "Unknown";
      byYearLevel[yearLevel] = (byYearLevel[yearLevel] ?? 0) + 1;
    }

    // ── Process employment record breakdowns ──────────────────────────────────
    const byDepartment: Record<string, number> = {};
    const byOffice: Record<string, number> = {};
    for (const er of employmentRecords) {
      const dept = er.Department?.name ?? "Unknown";
      byDepartment[dept] = (byDepartment[dept] ?? 0) + 1;

      const office = er.Office?.name ?? "Unknown";
      byOffice[office] = (byOffice[office] ?? 0) + 1;
    }

    return {
      message: "Organization reports retrieved successfully",
      data: {
        org,
        period: { from: from.toISOString(), to: to.toISOString() },
        members: {
          totalActive: allMembers.length,
          newInPeriod: newMembersInPeriod,
          pending: pendingCount,
          suspended: suspendedCount,
          byRole: Object.entries(membersByRole)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count),
          byGender: Object.entries(genderCounts)
            .map(([gender, count]) => ({ gender, count }))
            .sort((a, b) => b.count - a.count),
          byAgeGroup: Object.entries(ageGroupCounts)
            .filter(([, c]) => c > 0)
            .map(([group, count]) => ({ group, count })),
          registrationTrend: Object.entries(registrationsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        },
        students: {
          total: studentRecords.length,
          byCollege: Object.entries(byCollege)
            .map(([college, count]) => ({ college, count }))
            .sort((a, b) => b.count - a.count),
          byProgram: Object.entries(byProgram)
            .map(([program, count]) => ({ program, count }))
            .sort((a, b) => b.count - a.count),
          byYearLevel: Object.entries(byYearLevel)
            .map(([yearLevel, count]) => ({ yearLevel, count }))
            .sort((a, b) => b.count - a.count),
        },
        staff: {
          total: employmentRecords.length,
          byDepartment: Object.entries(byDepartment)
            .map(([department, count]) => ({ department, count }))
            .sort((a, b) => b.count - a.count),
          byOffice: Object.entries(byOffice)
            .map(([office, count]) => ({ office, count }))
            .sort((a, b) => b.count - a.count),
        },
      },
    };
  }
);
