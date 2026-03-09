"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetAllUsers = Awaited<ReturnType<typeof getAllUsersAction>>;
export async function getAllUsersAction({
  search,
  pageSize = 10,
  pageNumber = 1,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  const where = search
    ? {
      OR: [
        { userId: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ],
    }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        gender: true,
        dob: true,
        createdAt: true,
        updatedAt: true,
        verificationStatus: true,
        verifiedAt: true,
        _count: {
          select: {
            ClinicMembers: true,
            OrganizationMembers: true,
            Tenants: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type GetUserDetails = Awaited<ReturnType<typeof getUserDetailsAction>>;
export async function getUserDetailsAction(userId: string) {
  const user = await prisma.user.findFirst({
    where: { userId },
    select: {
      id: true,
      userId: true,
      email: true,
      firstName: true,
      lastName: true,
      middleName: true,
      gender: true,
      dob: true,
      createdAt: true,
      updatedAt: true,
      ClinicMembers: {
        select: {
          id: true,
          status: true,
          Clinic: {
            select: {
              id: true,
              name: true,
              clinicUid: true,
            },
          },
          Role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      OrganizationMembers: {
        select: {
          id: true,
          status: true,
          Organization: {
            select: {
              id: true,
              name: true,
              orgUid: true,
            },
          },
          OrganizationRole: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      Tenants: {
        select: {
          id: true,
          name: true,
          tenantUid: true,
        },
      },
    },
  });

  return { data: user };
}
