"use server";

import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { Gender } from "@prisma";
import { withErrorHandling } from "@/lib/with-error-handling";

const ALLOWED_GENDERS = new Set<Gender>(["MALE", "FEMALE"]);

export type OrganizationMembersReportFilters = {
  orgUid: string;
  startDate?: string | null;
  endDate?: string | null;
  gender?: string | null;
  collegeId?: string | null;
  programId?: string | null;
  yearLevelId?: string | null;
};

export type OrganizationMembersReportRow = {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  gender: Gender | null;
  nationality: string | null;
  religion: string | null;
  email: string | null;
  mobile: string | null;
  telephone: string | null;
  birthdate: string | null;
  placeOfBirth: string | null;
  bloodType: string | null;
  civilStatus: string | null;
  organization: {
    id: number;
    name: string;
  };
  college: {
    id: number | null;
    name: string | null;
  };
  program: {
    id: number | null;
    name: string | null;
  };
  yearLevel: {
    id: number | null;
    name: string | null;
  };
  dateRegistered: string;
};

const parseOptionalNumber = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeGender = (value?: string | null): Gender | undefined => {
  if (!value) return undefined;
  const upper = value.toUpperCase() as Gender;
  return ALLOWED_GENDERS.has(upper) ? upper : undefined;
};

export type GetOrganizationMembersReport = Awaited<
  ReturnType<typeof getOrganizationMembersReportAction>
>;

export const getOrganizationMembersReportAction = withErrorHandling(
  async (filters: OrganizationMembersReportFilters) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const { orgUid } = filters;
    if (!orgUid) throw new Error("Organization UID is required");

    const membership = await prisma.organizationMember.findFirst({
      where: {
        User: { userId: session.user.sub },
        Organization: { orgUid },
        status: "ACTIVE",
      },
      select: {
        OrganizationRole: { select: { name: true } },
        User: {
          select: {
            HealthcareProviders: {
              select: { id: true },
              where: { isActive: true },
            },
          },
        },
      },
    });

    const roleName = membership?.OrganizationRole?.name?.toUpperCase() ?? "";
    const isOwner = roleName === "OWNER";
    const isAdmin = roleName === "ADMIN";
    const isHealthcareProviderMember =
      (membership?.User?.HealthcareProviders?.length ?? 0) > 0;

    if (!isOwner && !isAdmin && !isHealthcareProviderMember) {
      throw new Error("Forbidden");
    }

    const startDate = normalizeDate(filters.startDate);
    const endDate = normalizeDate(filters.endDate);
    const gender = normalizeGender(filters.gender);
    const collegeId = parseOptionalNumber(filters.collegeId);
    const programId = parseOptionalNumber(filters.programId);
    const yearLevelId = parseOptionalNumber(filters.yearLevelId);

    const members = await prisma.organizationMember.findMany({
      where: {
        Organization: { orgUid },
        status: "ACTIVE",
        OrganizationRole: {
          name: { equals: "Student", mode: "insensitive" },
        },
        ...(startDate || endDate
          ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
          : {}),
        User: {
          isActive: true,
          ...(gender ? { gender } : {}),
          StudentRecords: {
            some: {
              isActive: true,
              deletedAt: null,
              Organization: { orgUid },
              ...(collegeId ? { collegeId } : {}),
              ...(programId ? { programId } : {}),
              ...(yearLevelId ? { yearLevel: yearLevelId } : {}),
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        Organization: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            gender: true,
            nationality: true,
            religion: true,
            email: true,
            mobile: true,
            telephone: true,
            dob: true,
            placeOfBirth: true,
            bloodType: true,
            civilStatus: true,
            StudentRecords: {
              where: {
                isActive: true,
                deletedAt: null,
                Organization: { orgUid },
                ...(collegeId ? { collegeId } : {}),
                ...(programId ? { programId } : {}),
                ...(yearLevelId ? { yearLevel: yearLevelId } : {}),
              },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                College: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                Program: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                OrganizationYearLevel: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const data: OrganizationMembersReportRow[] = members.map((member) => {
      const user = member.User;
      const [studentRecord] = user.StudentRecords;

      return {
        firstName: user.firstName ?? null,
        middleName: user.middleName ?? null,
        lastName: user.lastName ?? null,
        suffix: user.suffix ?? null,
        gender: user.gender ?? null,
        nationality: user.nationality ?? null,
        religion: user.religion ?? null,
        email: user.email ?? null,
        mobile: user.mobile ?? null,
        telephone: user.telephone ?? null,
        birthdate: user.dob ? user.dob.toISOString() : null,
        placeOfBirth: user.placeOfBirth ?? null,
        bloodType: user.bloodType ?? null,
        civilStatus: user.civilStatus ?? null,
        organization: {
          id: member.Organization.id,
          name: member.Organization.name,
        },
        college: {
          id: studentRecord?.College?.id ?? null,
          name: studentRecord?.College?.name ?? null,
        },
        program: {
          id: studentRecord?.Program?.id ?? null,
          name: studentRecord?.Program?.name ?? null,
        },
        yearLevel: {
          id: studentRecord?.OrganizationYearLevel?.id ?? null,
          name: studentRecord?.OrganizationYearLevel?.name ?? null,
        },
        dateRegistered: member.createdAt.toISOString(),
      };
    });

    return {
      message: "Organization member report fetched successfully",
      data,
    };
  }, async (error, context) => {
    const message = error instanceof Error ? error.message : "Failed to fetch organization member report";
    if (message === "Forbidden") {
      return "Forbidden";
    }
    if (message === "Unauthorized") {
      return "Unauthorized";
    }
    if (message === "Organization UID is required") {
      return message;
    }
    console.error("Error context for getOrganizationMembersReportAction", context);
    return message;
  }
);
