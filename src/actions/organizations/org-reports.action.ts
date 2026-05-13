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

type PeriodMemberRow = {
  id: number;
  createdAt: Date;
  OrganizationRole: {
    name: string;
  };
  User: {
    id: number;
    gender: string | null;
    dob: Date | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    suffix: string | null;
    email: string | null;
  };
};

type RawMemberRow = {
  memberId: number;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  email: string | null;
  role: string;
  gender: string;
  birthdate: string | null;
  ageGroup: string;
  dateRegistered: string;
};

const getAgeGroup = (dob: Date | null | undefined, now: Date): string => {
  if (!dob) return "Unknown";

  const ageYears = Math.floor(
    (now.getTime() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  if (ageYears <= 12) return "0-12";
  if (ageYears <= 17) return "13-17";
  if (ageYears <= 25) return "18-25";
  if (ageYears <= 35) return "26-35";
  if (ageYears <= 45) return "36-45";
  if (ageYears <= 59) return "46-59";
  return "60+";
};

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
      // Total active members (all time, no date filter) — used for the "Total Active" KPI
      totalActiveMembersCount,
      // Members who joined within the selected period — used for all breakdowns
      periodMembers,
      // Pending membership requests
      pendingCount,
      // Suspended members
      suspendedCount,
    ] = await Promise.all([
      // ── Total active members (unfiltered) ───────────────────────────────
      prisma.organizationMember.count({
        where: { organizationId: org.id, status: "ACTIVE" },
      }),

      // ── Members who joined in period (with details for breakdowns) ───────
      prisma.organizationMember.findMany({
        where: {
          organizationId: org.id,
          status: "ACTIVE",
          createdAt: dateFilter,
        },
        select: {
          id: true,
          createdAt: true,
          OrganizationRole: { select: { name: true } },
          User: {
            select: {
              id: true,
              gender: true,
              dob: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              email: true,
            },
          },
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
    ]);

    // Collect user IDs of members who joined in the period for scoped sub-queries
    const periodMemberUserIds = periodMembers.map(
      (member: PeriodMemberRow) => member.User.id
    );

    const [
      // Student records for members who joined in the selected period
      studentRecords,
      // Employment records for members who joined in the selected period
      employmentRecords,
    ] = await Promise.all([
      // ── Student records scoped to period members ─────────────────────────
      prisma.userStudentRecord.findMany({
        where: {
          organizationId: org.id,
          isActive: true,
          deletedAt: null,
          userId: { in: periodMemberUserIds },
        },
        select: {
          College: { select: { name: true } },
          Program: { select: { name: true } },
          OrganizationYearLevel: { select: { name: true } },
        },
      }),

      // ── Employment records scoped to period members ───────────────────────
      prisma.userEmploymentRecord.findMany({
        where: {
          organizationId: org.id,
          isActive: true,
          deletedAt: null,
          userId: { in: periodMemberUserIds },
        },
        select: {
          Department: { select: { name: true } },
          Office: { select: { name: true } },
        },
      }),
    ]);

    // ── Process member role counts (period members only) ─────────────────────
    const membersByRole: Record<string, number> = {};
    for (const m of periodMembers) {
      const role = m.OrganizationRole.name;
      membersByRole[role] = (membersByRole[role] ?? 0) + 1;
    }

    // ── Process daily registration trend (period members only) ────────────────
    const registrationsByDay: Record<string, number> = {};
    for (const m of periodMembers) {
      const day = m.createdAt.toISOString().slice(0, 10);
      registrationsByDay[day] = (registrationsByDay[day] ?? 0) + 1;
    }

    // ── Process gender distribution (period members only) ─────────────────────
    const genderCounts: Record<string, number> = {};
    for (const m of periodMembers) {
      const g = m.User.gender ?? "Unknown";
      genderCounts[g] = (genderCounts[g] ?? 0) + 1;
    }

    // ── Process age group distribution (period members only) ──────────────────
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
    for (const m of periodMembers) {
      const group = getAgeGroup(m.User.dob, now);
      ageGroupCounts[group] = (ageGroupCounts[group] ?? 0) + 1;
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

    const rawMemberRows: RawMemberRow[] = periodMembers.map(
      (member: PeriodMemberRow) => ({
        memberId: member.id,
        firstName: member.User.firstName ?? null,
        middleName: member.User.middleName ?? null,
        lastName: member.User.lastName ?? null,
        suffix: member.User.suffix ?? null,
        email: member.User.email ?? null,
        role: member.OrganizationRole.name,
        gender: member.User.gender ?? "Unknown",
        birthdate: member.User.dob ? member.User.dob.toISOString() : null,
        ageGroup: getAgeGroup(member.User.dob, now),
        dateRegistered: member.createdAt.toISOString(),
      })
    );

    return {
      message: "Organization reports retrieved successfully",
      data: {
        org,
        period: { from: from.toISOString(), to: to.toISOString() },
        members: {
          totalActive: totalActiveMembersCount,
          newInPeriod: periodMembers.length,
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
          raw: rawMemberRows,
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
