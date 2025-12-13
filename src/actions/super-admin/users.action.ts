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
        birthdate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ClinicMembersUser: true,
            OrganizationMembersUser: true,
            OwnedTenants: true,
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
      birthdate: true,
      createdAt: true,
      updatedAt: true,
      ClinicMembersUser: {
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
      OrganizationMembersUser: {
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
      OwnedTenants: {
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
